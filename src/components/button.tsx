import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  /**
   * Surface color this button sits on. Only matters for variant="outline":
   * the button needs an opaque fill (not literal transparency), or the
   * hard-shadow backing rect behind it shows through the entire button
   * instead of just its offset edge. Defaults to the page background --
   * pass the enclosing card's own background color when placing an
   * outline button on a card (see countdown-card.tsx, profile.tsx).
   */
  surfaceColor?: string;
}

const SHADOW_OFFSET = 4;

export function Button({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  onPress,
  onPressIn,
  onPressOut,
  surfaceColor,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const [isPressed, setIsPressed] = useState(false);
  // A disabled button must never carry the tactile shadow: on web it's an inline
  // boxShadow on the same element as `opacity`, so CSS composites them together --
  // fading the shadow into a translucent, offset ghost instead of just dimming the
  // button.
  const showShadow = !isDisabled && !isPressed;

  const backgroundColor =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? theme.error
        : variant === 'secondary'
          ? theme.backgroundElement
          : (surfaceColor ?? theme.background);

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'outline'
        ? theme.text
        : theme.text;

  const handlePress = (event: Parameters<NonNullable<typeof onPress>>[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(event);
  };

  // A plain-object style (e.g. { flex: 1 } to share a row with another
  // button) has to reach this outer wrapper too, not just the inner
  // Pressable -- the wrapper is what the parent flex container actually
  // sizes, so without this a caller's flex/width/margin silently does
  // nothing and the wrapper (and the shadow-backing rect sized from it)
  // can end up a different size than the visible button.
  const staticStyle = typeof style === 'function' ? undefined : style;

  return (
    <View style={[styles.wrapper, fullWidth && styles.fullWidth, staticStyle]}>
      {Platform.OS !== 'web' && showShadow ? (
        // A solid backing rect, not a native shadow: iOS shadow props rasterize the
        // view's own alpha content, so on a transparent (outline) background they'd
        // paint a ghost copy of the label text instead of a plain offset rectangle.
        <View
          pointerEvents="none"
          style={[
            styles.shadowBacking,
            fullWidth && styles.fullWidth,
            { backgroundColor: theme.borderHard },
          ]}
        />
      ) : null}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          fullWidth && styles.fullWidth,
          {
            backgroundColor,
            borderColor: theme.borderHard,
            opacity: isDisabled ? 0.45 : 1,
            transform: [{ translateY: pressed && !isDisabled ? 3 : 0 }],
            ...(Platform.OS === 'web' && showShadow ? tactileShadow(theme.borderHard, SHADOW_OFFSET) : null),
          },
          typeof style === 'function'
            ? style({ pressed, hovered: false } as Parameters<typeof style>[0])
            : style,
        ]}
        disabled={isDisabled}
        onPress={handlePress}
        onPressIn={(event) => {
          setIsPressed(true);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          setIsPressed(false);
          onPressOut?.(event);
        }}
        {...props}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <ThemedText style={[styles.label, { color: textColor }]}>{title}</ThemedText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  shadowBacking: {
    position: 'absolute',
    top: SHADOW_OFFSET,
    left: SHADOW_OFFSET,
    right: -SHADOW_OFFSET,
    bottom: -SHADOW_OFFSET,
    borderRadius: BorderRadius.full,
  },
  button: {
    paddingVertical: 17,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 17,
    fontFamily: Fonts.displaySemiBold,
  },
});
