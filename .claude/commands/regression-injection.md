---
description: Run a single regression-injection cycle against a caller-provided test backend (defaults to the wp-verify Playwright suite when BUILD_COMMAND / VERIFY_COMMAND are unset — see the skill for non-wp-verify backends). Baseline-stage → inject → verify the expected spec fails → revert → verify green. Invoked by /premium-analytics-implement-task Step 5, or standalone for dogfood/audit.
---

@../../.agents/skills/regression-injection.md
