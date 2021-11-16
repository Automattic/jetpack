# Add Milestone

Adds a valid milestone to all PRs that get merged and don't already include a milestone.

When searching for a milestone, this tasks looks for an opened milestone, with a set due date, and with a name matching the following format: `plugin-name/1.0`.
The plugin name should match a "[Plugin]" label on the PR, e.g. `[Plugin] Jetpack` would be matched with a "jetpack/9.5" format.

## Rationale

Having a milestone for each merged PR allows us to quickly access all code that was changed for a specific release, for easier review.
