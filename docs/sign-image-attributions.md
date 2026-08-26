# Sign image attributions

30 of the ~109 questions that reference a visual sign/marking/signal now
have `image_url` populated (25 distinct images), sourced from official UK
Department for Transport traffic sign artwork on Wikimedia Commons.

**Hosting**: all 25 images are now re-hosted in this project's own public
`sign-images` Supabase Storage bucket (created via the SQL below) rather
than hotlinked from Wikimedia — every URL has been individually verified
to resolve with a correct image content-type. This closes out the earlier
production risk of Wikimedia rate-limiting (429s) under real app traffic.
Two images with parentheses in their original filename ("(variant_1)",
"(right)") hit a URL double-encoding bug on first upload and were
re-uploaded under sanitized filenames (no special characters) — fixed and
verified, worth remembering for any future uploads to this bucket.

```sql
insert into storage.buckets (id, name, public) values ('sign-images', 'sign-images', true) on conflict (id) do nothing;
drop policy if exists "Public read access to sign images" on storage.objects;
create policy "Public read access to sign images" on storage.objects for select using (bucket_id = 'sign-images');
drop policy if exists "Anyone can upload sign images" on storage.objects;
create policy "Anyone can upload sign images" on storage.objects for insert with check (bucket_id = 'sign-images');
```

All images are Crown copyright, published under the **Open Government
Licence v1.0** (some also independently public domain in the US as
non-copyrightable government works), which permits commercial reuse with
attribution — appropriate for this app. The table below still links to
each image's original Wikimedia Commons source page for attribution
purposes; the live `image_url` on each question points to the re-hosted
Supabase Storage copy, not these Commons links directly.

| Sign | Diagram | Questions | Source |
|---|---|---|---|
| Stop | 601.1 | 4 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_601.1.svg |
| National speed limit applies (derestriction) | — | 2 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_derestriction.svg |
| No entry | 616 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_616.svg |
| Crossroads ahead | 504.1 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_504.1_(variant_1).svg |
| Roundabout ahead | 510 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_510.svg |
| T-junction ahead | 505.1 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_505.1_(right).svg |
| Motor vehicles prohibited | 619 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_619.svg |
| No right turn | 612 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_612.svg |
| Solo motor cycles prohibited | 619.2 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_619.2.svg |
| One-way traffic | 607 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_607.svg |
| Mini-roundabout | 611.1 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_611.1.svg |
| End of motorway regulations | 2931 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_2931.svg |
| Pedestrian (zebra) crossing ahead | 544 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_544.svg |
| Risk of ice or packed snow ahead | 554.2 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_554.2.svg |
| Ford ahead / water across the road | 554 | 2 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_554.svg |
| Side winds likely ahead | 581 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_581.svg |
| Tunnel ahead | 529.1 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_529.1.svg |
| Hump bridge ahead | 528 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_528.svg |
| Road hump(s) ahead | 557.1 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_557.1.svg |
| No stopping (clearway) | 642 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_642.svg |
| No overtaking | 632 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_632.svg |
| Give priority to vehicles from the opposite direction | 615 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_615.svg |
| Priority over vehicles from the opposite direction | 811 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_811.svg |
| Minimum speed limit 30 mph | 672 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_672.svg |
| End of 30 mph minimum speed limit | 673 | 1 | https://commons.wikimedia.org/wiki/File:UK_traffic_sign_673.svg |

## Not matched (still `image_url: null`)

Roughly 79 of the ~109 candidate questions remain unmatched. They fall
into a few groups:

1. **Photographic hazard-perception scenes** (e.g. "What's the main hazard
   shown in this picture?", "the red car (arrowed)") — these need an
   actual photograph of a specific driving scenario, not a standardized
   sign graphic. No suitable openly-licensed substitute exists.
2. **Ambiguous/variable symbols** — e.g. the diversion-route question
   explicitly states the symbol "may be a black triangle, square, circle
   or diamond shape," so there's no single correct image.
3. **Additional distinct signs, still sourceable but not yet found** —
   motorway gantry variants (lane control signals, countdown markers,
   red-cross-per-lane), arm signals (police and hand signals), road
   markings (zigzag lines, hatched areas, give-way lines, mini-roundabout
   arrows, overtake-return arrows, road-hump warning triangles), waiting-
   restriction plates (see caution below — sign 661.1 looked promising but
   turned out to be a different, more specific sign), the school-bus rear
   sign (covers 3 questions), the cycle-route sign (covers 2),
   traffic-lights-out-of-order (covers 2), tram signs (route-for-trams,
   give-way-to-trams, trams-crossing-ahead — covers ~4 questions; Commons
   search results for these repeatedly returned filenames that turned out
   not to exist or not to match on verification, e.g. a guessed
   "790-V1.svg" 404'd), bus/tram lane variants, and brown tourist signs.

**A caution for whoever continues this**: Wikimedia Commons' "UK traffic
sign NNN.svg" numbering (from the DfT's Traffic Signs Regulations
schedule) is NOT reliably guessable from a sign's common name — several
numbers checked across passes turned out to be completely different signs
than expected (642 was assumed to be "end of controlled parking zone" but
is actually "no stopping/clearway"; 516 assumed "quayside or river bank"
turned out to be "road narrows on both sides"; 633 assumed "no waiting"
is actually a police "STOP" sign; 661.1 assumed generic "waiting
restrictions" turned out to be the specific "free parking with time
restrictions" sign). AI-summarized Commons/search-result listings were
also unreliable for mapping number → meaning, and sometimes named files
that don't actually exist. **Always open the individual file page
directly and read its actual description before using it or recording it
as a match; verify the exact URL resolves (watch for HTTP 429 from
Wikimedia's own rate limiting on rapid successive checks — that's not the
same as a broken link, just space out repeated requests).** The DfT's own
"Traffic Signs Manual" / "Know Your Traffic Signs" PDF has an authoritative
number index and would likely be faster and more reliable than Commons
search for the remaining signs, especially the tram and arm-signal ones.

**Confirmed working, higher-confidence matches from this pass**: no
overtaking (632), give priority to oncoming traffic (615), priority over
oncoming traffic (811), minimum speed 30mph (672), end of minimum speed
30mph (673) — all individually verified on their own Commons file pages
before use, same standard as the rest of this document.
