# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0] - 2024-02-07
### Added
- Auto-label features in the mu-wpcom package. [#32221]
- Board triage: automate triage of Verbum-related issues. [#35326]
- Board triage task: automatically add issues classified as bugs to the project board. [#33493]
- Gather Support References task: automatically label issues that include support references. [#32398]
- Label automations: mark revert PRs with a label. [#33472]
- Label cleanup: Remove `[Status] Stale` from closed PRs. [#31743]
- New task: updateBoard allows you to automate updates to a GitHub Project Board fields to match priority labels on an issue in your repo. [#33469]
- Project Board automations: automatically update the status field based on the "Triaged" label. [#33482]
- Project Board triage: automatically assign teams to an issue based on issue labels. [#34313]
- Repo Gardening Action: Add add_labels input to addLabels task for setting custom path: label matching directly in the workflow. [#32306]

### Changed
- addMilestone task: if a milestone description contains a string with "Code Freeze: YYYY-MM-DD" or "Branch Cut: YYYY-MM-DD", and that date has elapsed, then don't add PRs to that milestone. This prevents merged PRs from being automatically added to milestones that have entered a code freeze. [#31973]
- Board triage: update team Zap's assignment settings. [#35466]
- Check description task: support different phrasing in milestone descriptiion. "Code Freeze" can also be "Branch cut". [#31987]
- Description task: update milestone details to include information about the different release schedules. [#33675]
- Gather Support References: also gather p2 comment references. [#33979]
- Gather Support References: consider forum links to be a valid support reference. [#35148]
- Issue Triage: update the "Escalated" status label to "Priority Review Triggered". [#33756]
- Label cleanup: Task now runs for closed issues as well as PRs. [#31743]
- Labelling: handle automatic labeling of Contact Form changes in the package. [#33864]
- Labels: prefix module labels with [Feature], to match new bug reporting tool. [#32118]
- Labels: update "Premium Content" to "Paid Content". [#33119]
- Labels: update Stats's label name. [#32916]
- Project Board triage: handle issues waiting on a third-party fix when auto-triaging. [#33876]
- Updated package dependencies. [#33650]
- Update the label used to mark issues that have reports from Happiness Engineers. [#32711]
- Use the node20 runner instead of the deprecated node16 runner. [#35262]

### Removed
- Description task: remove reference to "Required review" check that was removed a while back. [#33683]
- Status checks: remove commit verification status check. [#33075]

### Fixed
- Adds Woo Sync to GH label name exceptions. [#33713]
- Automated Board triage: fix event reference to trigger the action. [#34482]
- Board triage: ensure the task works when the organization name is capitalized [#34980]
- Don't crash on milestones with null description. [#32599]
- Issue references: avoid changing capitalization of p2 shortlinks. [#34426]
- Issue references: do not gather support references in Pull Requests, only in issues. [#34426]
- Project Board automations: do not run any automation on closed issues. [#33539]

## [4.0.0] - 2023-06-06
### Added
- Add new task to notify Quality team of important issues
- Add the legacy Photon label for PRs that make changes to the Image CDN package.
- Auto labeling: add labels for common elements of the CRM plugin.
- Create a new triageIssues task, to handle automated label triage and Slack notifications for important issues.

### Changed
- Add the Docs label whenever markdown files are edited.
- Auto-labeling: update logic to use new [Focus] label.
- Automated labeling: standardize how we track PRs with tests.
- Changed the features directory to include the module directory as well.
- Docs: Changing 'needs review' label wording for pull requests to more accurately reflect current processes
- Don't complain about missing a changelog entry if the changelog itself is being changed.
- Escalation task: update wording and icons.
- Kitkat escalation task: change the name of the label applied to escalated issues.
- Label management: do not loop through files for labels that do not require it.
- Only send Slack notifications for bugs.
- Triage tasks: update wording of messages and start warning folks of issues that do get any Priority label added automatically, so they can triage manually.
- Update auto-labeling rules for Boost features.
- Updated package dependencies.

### Removed
- The notifyKitKat and triageNewIssues tasks have been removed. The new triageIssues task now handles both of those tasks.

### Fixed
- Changelogger checks: do not error out when require or require-dev are not set.
- Triage: ensure we do not trigger triaging on events when a laabel that would impact our automated triage is already being added.
- Use correct emoji in Kitkat notifications

## [3.1.1] - 2023-02-07
### Changed
- Changed headings in the `PULL_REQUEST_TEMPLATE`.
- Update triage task to match new bug report template format.

### Fixed
- Clean up JavaScript eslint issues.

## [3.1.0] - 2022-11-01
### Added
- Add new task to gather support references in a separate comment.
- assignLabels: Add a '[Status] Needs Test Review' to PRs touching tests
- Automated triaging: add Platform label to new issues based on info provided in issue.
- Gather support references: add a specific label to an issue once it has gathered more than 10 issues.
- Gather support references: add option to send a Slack message when issuees start gathering a lot of tickets, and would need to be escalated.
- Labels: add [Status] In Progress label for draft PRs
- New task: Reply to customers Reminder -- Sends a Slack message to remind triage teams to reply to customers once an issue has been closed.
- Tooling: enable automatic GitHub releases when a new version of the action is tagged, so the new version can be made available in the GitHub Actions marketplace.

### Changed
- Documentation: update node version recommended in code sample
- Gather Support References / Reply to Customers: ping the right DRIs for Satellite products.
- Gather support references: add clarification that the comment is automated and should not be edited.
- Gather support references: stop gathering Live Chat references.
- General: disable Slack link and media previews in messages that are already custom-formatted.
- General: move all utilities into their own directory to keep things ordered
- Updated package dependencies.

### Fixed
- Ensure multiple plugins can be provided and then added as labels
- Gather Support References: avoid sending reminders for closed issues.
- Gather Support References: avoid throwing an error when an issue has no content.

## [3.0.0] - 2022-07-06
### Added
- Automatically add a Priority label based off the contents of an issue. [#24841]

### Changed
- Detect Renovate PRs created by self-hosted renovate. [#23307]
- Fusion comment bot: update wording to avoid confusion. [#23666]
- Renaming `master` references to `trunk`. [#24712, #24661]
- Reorder JS imports for `import/order` eslint rule. [#24601]
- Triage: update priority logic to follow issue priority matrix. [#24913]
- Updated package dependencies. [#24045, #24573]
- Use the node16 runner instead of the deprecated node12 runner. [#23389]
- WordPress.com Commit reminder: clarify wording of the message to help contributors. [#24860]

### Fixed
- Milestone management: avoid throwing an error when a valid milestone cannot be found. Abort task instead. [#22937]
- Only hit the milestones endpoint once per run. [#23126]
- Triage: only add priority label when one does not exist yet. [#24910]
- When a file is renamed, treat both the old and new names as modified. [#23354]

## [2.0.2] - 2022-02-09
### Changed
- Core: update description and metadata before to publish to marketplace.

## [2.0.1] - 2022-02-01
### Changed
- General: update required node version to v16.13.2
- Updated package dependencies

## [2.0.0] - 2021-11-02
### Added
- Automatically add the RNA label to PRs.

### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- BREAKING: Use `pull_request_target` instead of `pull_request` for the following tasks: assignIssues, addLabels, cleanLabels, checkDescription.
- Label Task: handle new block plugin type
- Updated package dependencies.
- Update regex for e2e tests paths to add relevant labels in PRs
- Use Node 16.7.0 in tooling. This shouldn't change the behavior of the code itself.

## [1.4.0] - 2021-08-26
### Added
- Add E2E Tests label in gardening.
- Include e2e test report url in PR bot comment.
- New task: triage newly opened issues to add the proper product labels.

### Changed
- jslint formatting.
- Labels: update label names to match new naming convention in use in the monorepo.
- Labels task: update paths to support new location of the Boost plugin.
- Update `@actions/github` with attendent code adjustments.
- Update node version requirement to 14.16.1.

### Fixed
- Milestone detection: fallback to any milestone when we cannot find any with a due date.

## [1.3.0] - 2021-05-28
### Fixed
- Slack notification tasks: both tasks now listen for `pull_request_target` events so they can be run on PRs opened from forks.

## [1.2.2] - 2021-05-21
### Fixed
- Boost: fix module name; it does not need to include a [Block] prefix.

## [1.2.1] - 2021-05-20
### Added
- Cache API calls for fetching labels and files on the PR.

### Changed
- Check Description task: update changelogger instructions to recommend the use of the CLI tool.
- Labels: handle Jetpack Boost plugin structure when automatically managing labels.
- Updated package dependencies

## [1.2.0] - 2021-04-16
### Added
- Add new Flag OSS task: flags entries by external contributors, adds an "OSS Citizen" label to the PR, and sends a Slack message.

### Changed
- Description task: do not add the "Needs Author Reply" label if the PR is still being worked on (the "In Progress" label is in use).

## [1.1.0] - 2021-03-31
### Added
- Add a new task to notify Editorial team when we want their feedback.
- Added autotagger action to simplify releases

### Changed
- Automatically add "JS Package" PR label.
- Expand list of labels to clean up after a PR has been merged.
- Mark parameters that are not used by all tasks as optional.

### Fixed
- handle production files for external use

## 1.0.0 - 2020-07-07

- Initial release

[5.0.0]: https://github.com/Automattic/action-repo-gardening/compare/v4.0.0...v5.0.0
[4.0.0]: https://github.com/Automattic/action-repo-gardening/compare/v3.1.1...v4.0.0
[3.1.1]: https://github.com/Automattic/action-repo-gardening/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/Automattic/action-repo-gardening/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/Automattic/action-repo-gardening/compare/v2.0.2...v3.0.0
[2.0.2]: https://github.com/Automattic/action-repo-gardening/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/Automattic/action-repo-gardening/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.4.0...v2.0.0
[1.4.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/Automattic/action-repo-gardening/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/Automattic/action-repo-gardening/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Automattic/action-repo-gardening/compare/v1.0.0...v1.1.0
