# Release Management

For every release, we will have a milestone that contains everything that is slated for that release.  <strong>Issues/PRs should not be mass-punted from one release to the next.</strong>  When getting punted from a release, issues/PRs should either have their milestone removed completely (from which they will need to be triaged), or they should be put into the "Not Currently Planned" milestone, which is any issue/PR that is valid, but not currently scheduled for inclusion in the point release or the next two major releases.

Any new feature/major bug fix going in gets tagged with "Primary Issue" and either "[Type] Bug Fix", "[Type] Enhancement", "[Type] Janitorial" or "[Type] Feature".  Initially, it should be tagged as "[Status] Proposal". If it's something that's absolutely required for this release, it gets tagged "[Priority] Blocker" so we know at a glance that it can't be moved to a future release.  It's also tagged with its' area of the plugin as usual.  The text of the primary issue should be the proposed implementation, and that text should ALSO be posted as the first comment (more on this in a second)

If an issue is fairly involved, it may also make sense to create a GitHub project for it, and that project should be linked to from the “Primary Issue”.  Any sub-issues created to track portions of a primary issue should be tagged “Subissue” and refer back to the primary issue # as the first line in the issue body so that they can easily be filtered.  Sub-issues should start at "[Status] In Progress".

Any PRs would then get connected to that primary issue, and conversation should take place within the primary issue, with the <em>original post being regularly updated with the current state of things</em>, so that anyone can see, at a glance, where the issue stands, but they can read through the comments for more context.  The Jetpack Lead and Release Lead should review any primary issues for the upcoming release weekly (as part of their call) to make sure that the main post body is up to date.  The last line of the main post body should always be “Last Updated: DATE"

The issue then gets updated as it moves through the process, from proposal to in progress to review needed to review complete to merged.

## Tag Details

### Tags: Type


- <em>Bug</em>: Something that is broken in the current public version of Jetpack
- <em>Feature</em>: An all-new feature
- <em>Enhancement</em>: An update to an existing feature
- <em>Janitorial</em>: Under-the-hood cleanups/improvements

### Tags: Status

- <em>Proposal</em> (Issues): For a primary issue, at this point it is being considered. Before leaving this status, there should be a clear plan for execution, designs should be completed (if needed), and there should be developers responsible for implementation. <strong>Only the Jetpack Lead should move a primary issue out of the Proposal stage</strong>.
- <em>In Progress</em> (Issues/PRs): At this point, an issue has finalized designs and developers working on it.  When development is complete, it should be moved to "Needs Review".  <strong>Master issues should stay "In Progress" until all of their PRs are merged, at which point they should transition to "Needs Testing"</strong>.
- <em>Needs Review</em> (PRs): This status indicates that a PR is in need of code review. Once that code review is complete, it should be moved to the "Needs Testing" status, unless the code reviewer also tested it, in which case it can move straight to "Ready to Merge"
- <em>Needs Design Review</em> (Issues/PRs): This status indicates than input from Jetpack Design is needed.  It's unique in that it can coexist with other statuses.
- <em>Needs Testing</em> (PRs): At this point, a PR is complete and has been code reviewed, it just needs to be tested. Upon successful testing, it should move to "Ready to Merge".
- <em>Ready to Merge</em> (PRs): From here, PRs have been completed, reviewed and tested.  From here, the Release Lead (or the Jetpack Lead, if needed) should do a final code review/test run and merge the PR.

### Tags: Priority


- <em>Blocker</em>: This is an issue that we can't ship without.  If it's not ready, the release needs to be delayed, the issue cannot be punted to a future release.
- <em>High</em>
- <em>Medium</em>
- <em>Low</em>


## Example Primary Issue and Subissue formatting

### Primary Issue

```
Synopsis: One or two sentences about what this Primary Issue is aiming to achieve.

Project: (Optional, if you are using a GitHub project to track the components of this MI, link to it here)

Responsible: The GitHub username(s) of the parties responsible for handling this issue. (these users should also be set as responsible through GitHub)

User experience: This should go into detail on what the user should experience using this feature/enhancement/fix

Technical approach: Any notes on how we'll attack things from a technical standpoint

Designs: This should be screenshots of the design

Complete: A number from 0-100% (including the % sign) representing (approximately) how far along this is

Difficulty:  A number from 1-40 representing (approximately) how difficult this is.  Imagine that each number from 1-10 indicates about half a day worth of work, or 4 hours of development

Last Updated: Date (by @username)
```
