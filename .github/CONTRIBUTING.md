# Want to contribute?

Did you know that you could be instrumental in making Jetpack more robust and secure? If you use and love Jetpack, why not contribute to the project?

## Contributing for Everyone!

Whether you can barely recognize a filter (or don’t know what that means) or you’ve already authored your own plugins, there are ways for you to pitch in.

### Beta Testing

Beta testers give updates, fixes, and new modules a test run before they’re publicly released, so they’re an important part of the development process. If you'd like to join our Beta group, [sign up to be a Beta tester here](http://jetpack.com/beta/).

### Create Bug Reports

If you find a bug, just [file a GitHub issue](https://github.com/Automattic/jetpack/issues/), that’s all. If you want to prefix the title with a “Question:”, “Bug:”, or the general area of the application, that would be helpful, but by no means mandatory. If you have write access, add the appropriate labels.

If you’re filing a bug, specific steps to reproduce are helpful. Please include the URL of the page that has the bug, along with what you expected to see and what happened instead. You can [check our recommendations to create great bug reports here](http://jetpack.com/contribute/#bugs).

### Write and submit a patch

If you'd like to fix a bug, you can submit a Pull Request. [Follow these detailed steps to find out how](http://jetpack.com/contribute/#patch).

When creating Pull Requests, remember:

- [Check In Early, Check In Often](http://blog.codinghorror.com/check-in-early-check-in-often/).
- Write [good commit messages](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).
- Respect the [Best practices for WordPress development](http://jetpack.com/contribute/#practices).

#### Code Reviews

Code reviews are an important part of the Jetpack workflow. They help to keep code quality consistent, and they help every person working on Jetpack learn and improve over time. We want to make you the best Jetpack contributor you can be.

Every PR should be reviewed and approved by someone other than the author, even if the author has write access. Fresh eyes can find problems that can hide in the open if you’ve been working on the code for a while.

The recommended way of finding an appropriate person to review your code is by [blaming](https://help.github.com/articles/using-git-blame-to-trace-changes-in-a-file/) one of the files you are updating and looking at who was responsible for previous commits on that file.

Then, you may ask that person to review your code by mentioning his/her GitHub username on the PR comments like this:

```
 cc @username
```

*Everyone* is encouraged to review PRs and add feedback and ask questions, even people who are new to Jetpack. Also, don’t just review PRs about what you’re working on. Reading other people’s code is a great way to learn new techniques, and seeing code outside of your own feature helps you to see patterns across the project. It’s also helpful to see the feedback other contributors are getting on their PRs.

#### Coding Standards & Guidelines

Consistent coding style makes the code so much easier to read. Here are ours:

- If you've created a new action or filter, [add inline documentation](https://make.wordpress.org/core/handbook/best-practices/inline-documentation-standards/php/#4-hooks-actions-and-filters) to help others understand how to use the action or the filter.
- Create [unit tests](https://github.com/Automattic/jetpack/tree/master/tests) if you can. If you're not familiar with Unit Testing, you can check [this tutorial](https://pippinsplugins.com/series/unit-tests-wordpress-plugins/).
- If [Grunt](http://gruntjs.com/) is installed on your testing environment, run it after committing your changes. It will allow you to [detect errors in Javascript files](http://jshint.com/about/), compile Sass to CSS, and [a few other things](https://github.com/Automattic/jetpack/blob/master/Gruntfile.js).

#### Lifecycle of a Pull Request

When you’re first starting out, your natural instinct when creating a new feature will be to create a local feature branch, and start building away. If you start doing this, *stop*, take your hands off the keyboard, grab a coffee and read on. :)

**It’s important to break your feature down into small pieces first**, each piece should become its own pull request.

Once you know what the first small piece of your feature will be, follow this general process while working:

1. Create a new branch, using [the branch naming scheme](https://github.com/Automattic/jetpack/wiki/Git-Workflow#branch-naming-scheme), _e.g._ `add/video-preview` or `fix/1337-language-too-geeky`.
2. Make your first commit: any will do even if empty or trivial, but we need something in order to create the initial pull request. Create the pull request and prefix the name with the section of the product, _e.g._ _Sharing: add new Facebook button_. Don’t worry too much if there’s no obvious prefix.
  - Write a detailed description of the problem you are solving, the part of Jetpack it affects, and how you plan on going about solving it.
  - If you have write access, add the **<span class="label status-in-progress">[Status] In Progress</span>** label or wait until somebody adds it. This indicates that the pull request isn’t ready for a review and may still be incomplete. On the other hand, it welcomes early feedback and encourages collaboration during the development process.
3. Start developing and pushing out commits to your new branch.
  - Push your changes out frequently and try to avoid getting stuck in a long-running branch or a merge nightmare. Smaller changes are much easier to review and to deal with potential conflicts.
  - Don’t be afraid to change, [squash](http://gitready.com/advanced/2009/02/10/squashing-commits-with-rebase.html), and rearrange commits or to force push - `git push -f origin fix/something-broken`. Keep in mind, however, that if other people are committing on the same branch then you can mess up their history. You are perfectly safe if you are the only one pushing commits to that branch.
  - Squash minor commits such as typo fixes or [fixes to previous commits](http://fle.github.io/git-tip-keep-your-branch-clean-with-fixup-and-autosquash.html) in the pull request.
4. If you end up needing more than a few commits, consider splitting the pull request into separate components. Discuss in the new pull request and in the comments why the branch was broken apart and any changes that may have taken place that necessitated the split. Our goal is to catch early in the review process those pull requests that attempt to do too much.
5. When you feel that you are ready for a formal review or for merging into `master` make sure you check this list.
  - Make sure your branch merges cleanly and consider rebasing against `master` to keep the branch history short and clean.
  - If there are visual changes, add before and after screenshots in the pull request comments.
  - Add unit tests, or at a minimum, provide helpful instructions for the reviewer so he or she can test your changes. This will help speed up the review process.
  - Ensure that your commit messages are [meaningful](http://robots.thoughtbot.com/5-useful-tips-for-a-better-commit-message).
6. Mention that the PR is ready for review or if you have write access remove the **<span class="label status-in-progress">[Status] In Progress</span>** label from the pull request and add the **<span class="label status-needs-review">[Status] Needs Review</span>** label - someone will provide feedback on the latest unreviewed changes. The reviewer will also mark the pull request as **<span class="label needs-author-reply">[Status] Needs Author Reply</span>** if they think you need to change anything.
7. If you get a <img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f44d.png" class="emoji" />, <img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f4a5.png" class="emoji" />, <img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f6a2.png" class="emoji" />, <img src="https://assets-cdn.github.com/images/icons/emoji/shipit.png" class="emoji" />, or a LGTM, the pull request is ready to be merged into `master`.

Whether somebody is reviewing your code or you are reviewing somebody else’s code, [a positive mindset towards code reviews](https://medium.com/medium-eng/the-code-review-mindset-3280a4af0a89) helps a ton. We’re building something together that is greater than the sum of its parts.

If you feel yourself waiting for someone to review a PR, don’t hesitate to personally ask for someone to review it or to mention them on GitHub.

#### Lifecycle of a Pull Request

When you’re first starting out, your natural instinct when creating a new feature will be to create a local feature branch, and start building away. If you start doing this, *stop*, take your hands off the keyboard, grab a coffee and read on. :)

**It’s important to break your feature down into small pieces first**, each piece should become its own pull request.

Once you know what the first small piece of your feature will be, follow this general process while working:

1. Create a new branch, using [the branch naming scheme](https://github.com/Automattic/jetpack/wiki/Git-Workflow#branch-naming-scheme), _e.g._ `add/video-preview` or `fix/1337-language-too-geeky`.
2. Make your first commit: any will do even if empty or trivial, but we need something in order to create the initial pull request. Create the pull request and prefix the name with the section of the product, _e.g._ _Sharing: add new Facebook button_. Don’t worry too much if there’s no obvious prefix.
  - Write a detailed description of the problem you are solving, the part of Jetpack it affects, and how you plan on going about solving it.
  - If you have write access, add the **<span class="label status-in-progress">[Status] In Progress</span>** label or wait until somebody adds it. This indicates that the pull request isn’t ready for a review and may still be incomplete. On the other hand, it welcomes early feedback and encourages collaboration during the development process.
3. Start developing and pushing out commits to your new branch.
  - Push your changes out frequently and try to avoid getting stuck in a long-running branch or a merge nightmare. Smaller changes are much easier to review and to deal with potential conflicts.
  - Don’t be afraid to change, [squash](http://gitready.com/advanced/2009/02/10/squashing-commits-with-rebase.html), and rearrange commits or to force push - `git push -f origin fix/something-broken`. Keep in mind, however, that if other people are committing on the same branch then you can mess up their history. You are perfectly safe if you are the only one pushing commits to that branch.
  - Squash minor commits such as typo fixes or [fixes to previous commits](http://fle.github.io/git-tip-keep-your-branch-clean-with-fixup-and-autosquash.html) in the pull request.
4. If you end up needing more than a few commits, consider splitting the pull request into separate components. Discuss in the new pull request and in the comments why the branch was broken apart and any changes that may have taken place that necessitated the split. Our goal is to catch early in the review process those pull requests that attempt to do too much.
5. When you feel that you are ready for a formal review or for merging into `master` make sure you check this list.
  - Make sure your branch merges cleanly and consider rebasing against `master` to keep the branch history short and clean.
  - If there are visual changes, add before and after screenshots in the pull request comments.
  - Add unit tests, or at a minimum, provide helpful instructions for the reviewer so he or she can test your changes. This will help speed up the review process.
  - Ensure that your commit messages are [meaningful](http://robots.thoughtbot.com/5-useful-tips-for-a-better-commit-message).
6. Mention that the PR is ready for review or if you have write access remove the **<span class="label status-in-progress">[Status] In Progress</span>** label from the pull request and add the **<span class="label status-needs-review">[Status] Needs Review</span>** label - someone will provide feedback on the latest unreviewed changes. The reviewer will also mark the pull request as **<span class="label needs-author-reply">[Status] Needs Author Reply</span>** if they think you need to change anything.
7. If you get a <img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f44d.png" class="emoji" />, <img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f4a5.png" class="emoji" />, <img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f6a2.png" class="emoji" />, <img src="https://assets-cdn.github.com/images/icons/emoji/shipit.png" class="emoji" />, or a LGTM, the pull request is ready to be merged into `master`.

Whether somebody is reviewing your code or you are reviewing somebody else’s code, [a positive mindset towards code reviews](https://medium.com/medium-eng/the-code-review-mindset-3280a4af0a89) helps a ton. We’re building something together that is greater than the sum of its parts.

If you feel yourself waiting for someone to review a PR, don’t hesitate to personally ask for someone to review it or to mention them on GitHub.

#### Where to get started?

If you'd like to contribute but don't know where to get started, you can take a look at existing issues:

- ["Good First Bug"](https://github.com/Automattic/jetpack/labels/%5BType%5D%20Good%20First%20Bug) issues are a good entry point to get familiar with Jetpack's codebase.
- All issues labeled with [the "Community" milestone](https://github.com/Automattic/jetpack/issues?q=is%3Aopen+is%3Aissue+milestone%3ACommunity) are fair game. That's a great way to contribute new features and fix small issues within Jetpack.
- ["Whisky"](https://github.com/Automattic/jetpack/labels/Whisky%20Ticket) issues are important bugs or enhancements. Take a crack at it if you feel adventurous! :)

#### We’re Here To Help

We encourage you to ask for help at any point. We want your first experience with Jetpack to be a good one, so don’t be shy. If you’re wondering why something is the way it is, or how a decision was made, you can tag issues with **<span class="label type-question">[Type] Question</span>** or prefix them with “Question:”.
