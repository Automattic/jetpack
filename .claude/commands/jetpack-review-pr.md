---
description: Review a Jetpack PR for bugs, security, performance, conventions, and test coverage
---

Review a Jetpack pull request. Provide a PR number/URL and optionally a depth level.

Usage: `/jetpack-review-pr <PR> [quick|standard|thorough]`

Examples:
- `/jetpack-review-pr 47741` — auto-detects depth from PR size
- `/jetpack-review-pr 47741 quick` — fast review (~1-2 min)
- `/jetpack-review-pr 47741 thorough` — full review with tests (~15 min)

@../../.agents/skills/jetpack-review-pr.md

Arguments: $ARGUMENTS
