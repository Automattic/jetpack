Significance: patch
Type: fixed
Comment: Fix tests: `.toHaveStyle()` uses `getComputedStyle()`, which in jsdom v30 returns lengths in px (matching browser behavior).


