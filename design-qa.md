# 月色海风主题验收

Date: 2026-10-18

## Scope and visual target

The selected homepage concept supplies the lavender maritime palette, serif Chinese headline, left reading invitation, tilted right postcard, soft transition into latest articles, and Q版 companion. The right postcard is intentionally an environment-only rose conservatory image, as explained before implementation. The companion uses the original transparent sprite linked in source/pet/README.txt.

The original environment assets and desktop/mobile rendered captures were opened and visually compared. The character panel from the original concept is not reproduced.

## Findings and corrections

- Resolved P2: initial backdrop saturation weakened header and small-text contrast. Reduced backdrop opacity and darkened foreground text and the primary button; recaptured desktop and mobile.
- Resolved P2: an expanded companion obscured part of the first mobile reading area. First mobile visits now begin with a compact summon button. Users can open, drag, collapse and remember their choice.
- Resolved P2: old companion CSS could stretch the restore button when theme placement changed sides. Increased placement selector specificity and verified its compact width.
- No P0/P1/P2 issues remain in the verified theme and companion scope.

## Required visual surfaces

- Typography: Chinese serif headlines, italic English signature, 16px article text and 14px previews. Wrapping and title bounds checked at 320, 390, 768, 1024, 1440 and 1920px widths. Brand and navigation remain separated.
- Layout: two-column desktop hero and horizontal article preview; stacked mobile hero, postcard and article. Margins, crop, card padding and reading column visually inspected. No horizontal overflow.
- Colors: lavender ink, pale ivory article surfaces, lightened dusk backdrop and darker muted metadata. A mask blends the real environment image into the page without an abrupt boundary.
- Assets: two original environment illustrations retain their aspect ratios with intentional crops. The Q版 sprite is the original file; no generated replacement or placeholder asset is shipped.
- Copy: actual Hexo title, date, excerpt and tags. Article, tag and archive pages are generated from content. No invented posts; descriptive navigation and control labels.

## Browser evidence and behavior

Captured screenshots: moonsea-desktop.png, moonsea-desktop-viewport.png, moonsea-mobile.png, moonsea-post.png, moonsea-archive.png, moonsea-mobile-post.png, moonsea-mobile-pet.png.

Checks passed: image loading; responsive header/layout at six widths; primary read link and keyboard focus; post, tag, archive and home navigation; desktop pet; mobile initial collapse, summon and interaction; reduced-motion preference; no theme/companion script errors or missing assets.

Pet regression: greeting/hop, sleep/wake, dragging, position persistence, collapse/restore, reset, mobile bounds and reduced motion.

## Follow-up polish

P3: the editable wordmark uses an italic system serif rather than handwritten lettering. The companion retains the low-resolution game sprite; its animation is whole-sprite bobbing and hop, not Live2D or articulated limbs.

final result: passed

