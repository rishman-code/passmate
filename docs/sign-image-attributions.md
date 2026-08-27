# Question image attributions

**208 of the app's 714 questions now have `image_url` populated** (205
distinct images), all sourced from the official DVSA image set (313
files) supplied by the user. The earlier Wikimedia-sourced images have
been fully replaced.

## Note: a regression happened and was caught and fixed

A background pass (launched to visually match images before the official
question-bank spreadsheet was discovered) finished after the
spreadsheet-driven matching was already done, and — working blind to the
spreadsheet's existence — overwrote 55 already-correct, spreadsheet
matched rows with its own less-certain visual guesses (last-write-wins on
the same table). The pass caught and reported this itself. Fixed by
re-running the deterministic spreadsheet matcher against exactly the 55
affected rows and repointing them at their already-uploaded authoritative
image (no re-upload needed — same file, just restoring the DB reference).
Of the fork's 58 total updates, **3 had no spreadsheet match** (our
question wording diverges too much from the official bank's for text
matching) — these were individually viewed and verified correct by eye
before being kept: a motorway red-cross-over-one-lane question, a bus
pulling away from a stop, and an amber-traffic-light-alone question
(verified this one specifically shows amber lit *alone*, not red+amber
together — a different UK traffic-light stage that would have been a
real factual error if mixed up).

**Lesson for future passes**: when multiple agents/passes touch the same
data source concurrently, the one working from a less authoritative
method can silently clobber a better one if it finishes later — worth
either sequencing dependent work or diffing against source-of-truth
after any pass that runs in parallel with data-modifying work.

## Official DVSA images — primary source

The user supplied the real official DVSA Category B theory test image set
(313 files, `C:\Users\rishi\OneDrive\Pictures\DVSA Images`, confirmed by
the user to be officially licensed by the DVSA) plus the official question
bank spreadsheet (`Car (Cat B) QB Feb 2026.xlsx`, 758 questions) that maps
each question to its exact image filename via `Stem.gif` / `A.gif` /
`B.gif` / `C.gif` / `D.gif` columns.

**Matching method**: our AI-generated question bank turned out to closely
reproduce this official bank's wording in most cases (likely because the
generator, when asked for "factually-accurate DVSA-style questions", drew
on real DVSA questions from its training data). This meant matching could
be done by exact/near-exact text comparison — question text + all four
options, normalized and compared as a word-overlap score — rather than by
visually guessing among 313 uncaptioned images. Full pipeline:

1. Parsed the spreadsheet, kept only rows with a non-empty `Stem.gif`.
2. For every question in our bank still missing `image_url`, scored it
   against every image-bearing official row (stem + 4 options, normalized
   word-overlap).
3. **171 questions scored a perfect 1.00** (verbatim-identical text) —
   treated as safe to auto-match.
4. **6 questions scored 0.60–0.67** — manually reviewed every one before
   using any of them, because they turned out to be a trap: all 6 were
   competing against a sibling question that already had its own 1.00
   match to the same official item. On inspection, **4 of the 6 were
   genuinely different scenarios that just share vocabulary** with their
   1.00 sibling (a "moped" question scored 0.63 against a cyclist
   question's image; "red cross over your lane only" scored 0.63 against
   "red cross over every lane"; a "busy main road, wrong direction"
   question scored against a "one-way street, wrong route" image; a
   "bicycle wheel between parked cars" question scored against a "ball
   bounces into the road" image) — these were correctly left unmatched
   rather than forced. **The other 2 were legitimate rephrasings of the
   same scenario as their sibling** and were included after manual
   verification: cyclist-signalling-right-at-roundabout, and
   red-lights-still-flashing-after-train-passes-level-crossing.
5. Verified all 173 referenced files exist locally (they did, 0 missing),
   then read each local file directly and uploaded it to the `sign-images`
   Supabase Storage bucket, sanitizing filenames (prefixed `dvsa_`, special
   characters stripped) to avoid the URL-encoding bug noted below. All
   updated rows verified to resolve (200 status, correct content-type).

**This also revealed the original problem was undercounted**: the
~109-question estimate came from a keyword search for "sign"/"marking" in
question text. The official spreadsheet shows image-bearing questions
across many more categories that don't use those words at all — e.g.
"What's the main hazard shown in this picture?" or "What should the
driver of the red car (arrowed) do?" (Hazard Awareness), cyclist/pedestrian
scenarios (Vulnerable Road Users), motorway gantry scenarios (Motorway
Rules). Several of the "structurally unfixable" photographic
hazard-perception questions from earlier passes turned out to be fixable
after all once matched against the real official photos.

**License**: officially licensed by the DVSA per the user, who supplied
the files directly — recorded here as stated; this project has no
independent way to verify DVSA's license terms beyond that.

## Superseded: Wikimedia Commons (no longer used)

Three early passes sourced 32 questions' worth of UK road sign diagrams
from Wikimedia Commons (Open Government Licence v1.0 / Crown copyright,
individually verified on each file's own Commons page) before the official
DVSA source became available. **These have all been replaced** with the
official equivalents once the real question-bank spreadsheet made it
possible to match every one of them with a perfect 1.00 text-similarity
score (verbatim-identical question + option text) — no manual review
needed, all 32 were unambiguous. The old Wikimedia-sourced files are still
sitting in the `sign-images` bucket, orphaned (no question references
them anymore) — harmless, but could be deleted as cleanup if wanted. See
git history on this file for the detailed sign-by-sign table from those
passes if needed for reference.

## Hosting

All images live in this project's own public `sign-images` Supabase
Storage bucket, not hotlinked externally — avoids the Wikimedia
rate-limiting (429s) observed when hitting their thumbnail service
directly under repeated access, back when that was still the source.
Bucket setup (idempotent, safe to re-run):

```sql
insert into storage.buckets (id, name, public) values ('sign-images', 'sign-images', true) on conflict (id) do nothing;
drop policy if exists "Public read access to sign images" on storage.objects;
create policy "Public read access to sign images" on storage.objects for select using (bucket_id = 'sign-images');
drop policy if exists "Anyone can upload sign images" on storage.objects;
create policy "Anyone can upload sign images" on storage.objects for insert with check (bucket_id = 'sign-images');
```

**Known pitfall**: filenames with parentheses (e.g. `(variant_1)`) hit a
URL double-encoding bug on upload — sanitize filenames to
alphanumerics/dashes/underscores/dots only before uploading to this
bucket.

## What's likely still missing

506 of 714 questions still have no image. The official spreadsheet's 758
questions include some images not yet matched to our bank (our bank was
generated independently, so not every official question has a
corresponding one here, and vice versa some of our questions may be
paraphrased differently enough that the word-overlap matcher missed a
real match — anything below the 1.00/manually-verified bar was
deliberately left alone rather than guessed). Many of the 506 genuinely
don't need an image at all (pure knowledge/procedure questions like
insurance or documents) — no attempt has been made yet to separate those
from ones that do need an image but weren't matched.

To extend coverage further: re-run the matching script with a lower
threshold and manually review each candidate the way the borderline ones
in this document were reviewed (word-overlap alone is not safe below
~1.00, as shown by the false positives caught along the way), or work
from the official spreadsheet's remaining un-mapped rows directly.
