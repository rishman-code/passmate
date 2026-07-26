/**
 * Keeps the Expo web dev server alive in the preview container.
 * Loaded via NODE_OPTIONS="--require /app/scripts/ws-polyfill.js".
 *
 * The Metro/@expo/cli dev server opens a websocket (HMR + logs) through the
 * k8s ingress. When the tunnel drops the connection mid-frame, `ws` emits an
 * unhandled socket error that takes the whole dev server process down. We
 * absorb those transient socket faults instead of crashing.
 */

const TRANSIENT = new Set([
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  'ECANCELED',
  'ERR_STREAM_WRITE_AFTER_END',
  'ERR_STREAM_DESTROYED',
  'WS_ERR_UNEXPECTED_RSV_1',
  'WS_ERR_INVALID_OPCODE',
  'WS_ERR_INVALID_CLOSE_CODE',
  'WS_ERR_UNEXPECTED_MASK',
  'WS_ERR_EXPECTED_MASK',
  'WS_ERR_INVALID_UTF8',
]);

const isTransient = (err) => {
  if (!err) return false;
  if (TRANSIENT.has(err.code)) return true;
  const msg = String(err.message || '');
  return (
    /context deadline exceeded/i.test(msg) ||
    /socket hang up/i.test(msg) ||
    /websocket/i.test(msg) && /clos|reset|abort/i.test(msg)
  );
};

// Node 20 ships no global WebSocket. @supabase/supabase-js constructs a
// RealtimeClient inside createClient() and throws "Node.js detected but native
// WebSocket not found" during expo-router SSR, which 500s every page.
if (typeof globalThis.WebSocket === 'undefined') {
  try {
    const mod = require('/app/node_modules/ws');
    // ws@7 exports the class as module.exports; ws@8 exports { WebSocket }.
    const WebSocket = mod.WebSocket || mod;
    // Node 20 predefines WebSocket as a getter-only lazy global, so a plain
    // assignment is silently dropped. Redefine the property instead.
    Object.defineProperty(globalThis, 'WebSocket', {
      value: WebSocket,
      writable: true,
      configurable: true,
      enumerable: false,
    });
    console.log('[ws-polyfill] installed global WebSocket from ws');
  } catch (err) {
    console.warn('[ws-polyfill] could not install global WebSocket:', err.message);
  }
}

// Node's default of 10 is too low: Metro attaches many listeners per client.
require('events').EventEmitter.defaultMaxListeners = 100;

process.on('uncaughtException', (err) => {
  if (isTransient(err)) {
    console.warn('[ws-polyfill] absorbed transient socket error:', err.code || err.message);
    return;
  }
  throw err;
});

process.on('unhandledRejection', (reason) => {
  if (isTransient(reason)) {
    console.warn('[ws-polyfill] absorbed transient socket rejection:', reason.code || reason.message);
    return;
  }
  throw reason;
});

// Attach a no-op error handler to every ws server/socket so a missing listener
// can never escalate into an uncaughtException.
try {
  const ws = require('/app/node_modules/ws');
  const guard = (target) => {
    if (target && typeof target.on === 'function') {
      target.on('error', (err) => {
        console.warn('[ws-polyfill] ws error:', err && (err.code || err.message));
      });
    }
    return target;
  };

  if (ws.WebSocketServer || ws.Server) {
    const OriginalServer = ws.WebSocketServer || ws.Server;
    class PatchedServer extends OriginalServer {
      constructor(...args) {
        super(...args);
        guard(this);
        this.on('connection', guard);
      }
    }
    if (ws.WebSocketServer) ws.WebSocketServer = PatchedServer;
    ws.Server = PatchedServer;
  }
} catch {
  // `ws` not resolvable from this cwd yet; the process-level guards still apply.
}
