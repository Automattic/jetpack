# Life Cycle of a Pull Request

When you’re first starting out, your natural instinct when creating a new feature will be to create a local feature branch, and start building away. If you start doing this, *stop*, take your hands off the keyboard, grab a coffee and read on. :)

**It’s important to break your feature down into small pieces first**, each piece should become its own pull request.

Once you know what the first small piece of your feature will be, follow this general process while working:

1. [Create a new branch, following our Git Workflow.](git-workflow.md)
1. Make your first commit: we need something in order to create the initial pull request. Create the pull request and prefix the name with the section of the product, _e.g._ _Sharing: add new Facebook button_. Don’t worry too much if there’s no obvious prefix.
    - Write a detailed description of the problem you are solving, the part of Jetpack it affects, and how you plan on going about solving it.
    - If you have write access, add the **<span class="label status-in-progress">[Status] In Progress</span>** label or wait until somebody adds it. This indicates that the pull request isn’t ready for a review and may still be incomplete. On the other hand, it welcomes early feedback and encourages collaboration during the development process.
1. Start developing and pushing out commits to your new branch.
    - Push your changes out frequently and try to avoid getting stuck in a long-running branch or a merge nightmare. Smaller changes are much easier to review and to deal with potential conflicts.
    - Don’t be afraid to change, [squash](http://gitready.com/advanced/2009/02/10/squashing-commits-with-rebase.html), and rearrange commits or to force push - `git push --force-with-lease origin fix/something-broken`. Keep in mind, however, that if other people are committing on the same branch then you can mess up their history. You are perfectly safe if you are the only one pushing commits to that branch.
    - Squash minor commits such as typo fixes or [fixes to previous commits](http://fle.github.io/git-tip-keep-your-branch-clean-with-fixup-and-autosquash.html) in the pull request.
    - Remember to [respect Coding Standards & Guidelines.](coding-guidelines.md)
1. If you have [Composer installed](https://getcomposer.org/), you can run `composer install` and `composer phpcs:lint [directory or files updated]` to check your changes against WordPress coding standards. Many files are not fully within the standard yet, but please ensure your changes respect current coding standards.
1. If you end up needing more than a few commits, consider splitting the pull request into separate components. Discuss in the new pull request and in the comments why the branch was broken apart and any changes that may have taken place that necessitated the split. Our goal is to catch early in the review process those pull requests that attempt to do too much.
1. When you feel that you are ready for a formal review or for merging into `trunk` make sure you check this list.
    - Make sure your Pull Request [includes a changelog entry](writing-a-good-changelog-entry.md) for each project touched.
    - Make sure all required checks (other than "Required review") listed at the bottom of the Pull Request are passing.
    - Make sure your branch merges cleanly and consider rebasing against `trunk` to keep the branch history short and clean.
    - If there are visual changes, add before and after screenshots in the pull request comments.
    - Add unit tests, or at a minimum, provide helpful instructions for the reviewer so they can test your changes. This will help speed up the review process.
    - Check [Coding Standards & Guidelines](coding-guidelines.md) one last time.
1. Mention that the PR is ready for review. If you have write access, remove the **<span class="label status-in-progress">[Status] In Progress</span>** label from the pull request and add the **<span class="label status-needs-team-review">[Status] Needs Team Review</span>** label - someone on your team will provide feedback on the latest unreviewed changes. The reviewer will also mark the pull request as **<span class="label needs-author-reply">[Status] Needs Author Reply</span>** if they think you need to change anything. You can [learn more about our code reviews here.](code-reviews.md)
1. Once someone on your team has approved the changes, they'll update the labels from **<span class="label status-needs-team-review">[Status] Needs Team Review</span>** to **<span class="label status-needs-review">[Status] Needs Review</span>** so one of the Jetpack Approvers can do a final review of your Pull Request before it can be merged.
1. If your PR contains important changes and needs to be included in the next release, let us know! You can do so in the PR description, or in a comment on that PR. If you have the permissions, you can also add the **<span class="label pri-blocker">[Pri] Blocker</span>** label to the PR. You can also reach out to us directly if needed, either by mentioning one of us in the PR or via Slack if you're a member of the Automattic team.
1. If you get a **<span class="label ready-to-merge">[Status] Ready To Merge</span>** label, the pull request is ready to be merged into `trunk`.
