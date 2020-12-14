# Writing a good Changelog Entry

Part of our standard PR template is "Proposed changelog entry for your changes". This document will help you write a good one.

## Do I even need one?

Our changelog is intended for the users of Jetpack, primarily end users but also third-party developers who use our public APIs and packages.

If you've changed something that users will notice, like improving the display of a block or fixing a bug that prevents a site feature from working, then by all means suggest a changelog entry.

If you've improved our CI or development environments, or refactored old code without user-visible changes, or something like that, it's probably not something that's worth mentioning in the changelog. But don't worry, we still appreciate it! And remember to say so in the appropriate section of the PR template, don't just leave it blank.

If you're unsure, feel free to go ahead and suggest a changelog entry, or to ask.

P.S. If your PR doesn't need a changelog entry, feel free to remove the "Needs Changelog" tag that a bot adds after merging.

## What should I write?

Our changelog entries typically begin with a component name, such as "Payments Block" or "Sync".

The rest of the changelog entry is a sentence fragment (beginning with a bare infinitive verb) describing what the PR does. Remember that this is aimed at end users, so be wary of jargon and details of the code. If it helps, consider filling in blank in the sentence "This PR will ______".

Some good examples:

* Contact Form Block: display fallback link when the block is rendered in non-WordPress contexts, such as subscription emails.
* Edit Post API: restore post comments when untrashing a post, such as via the mobile apps.
* Instagram Embeds: add support for embed parameters supported by Instagram.
* Payments Block: move unreadable notice to the sidebar.
* Search: improve URL formatting for the expanded search layout.
* Sitemaps: ensure that the Home URL is slashed on subdirectory websites.
* WhatsApp Button: fix Guyana country code metadata.
* General: ensure Jetpack's full compatibility with the upcoming WordPress 5.6 release.
* General: update Jetpack's minimum required WordPress version to 5.5, in anticipation of the upcoming WordPress 5.6 release.

You can find many more examples by looking through [changelog.txt](../changelog.txt).
