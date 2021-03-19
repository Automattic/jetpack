# Writing A Good Changelog Entry

Part of our standard [Pull Request process](./monorepo.md#jetpack-changelogger) includes submitting a changelog entry for your changes, which this document provides guidance on.

## How do I create a changelog entry?

**[Follow the instructions here to use the changelogger tool to create a new entry.](./monorepo.md#using-the-jetpack-changelogger)**

## Do I even need to write a changelog entry?

For Jetpack, our changelog is intended primarily for end users and third-party developers who use our public APIs and packages. Other projects in the Jetpack monorepo also benefit from managing an accurate changelog.

If you've changed something that users will notice, like improving the display of a block or fixing a bug that prevents a feature from working, then by all means submit a suggested changelog entry.

If you've improved our CI or development environments, or refactored old code without user-visible changes, it's probably not a change that needs a changelog entry intended for end users. However, you would still include a change file with a ["Comment" header](./monorepo.md#using-the-jetpack-changelogger) which would be omitted from the generated changelog, but still serve as documentation to other developers.

If you're ever unsure, feel free to ask for help.

## What should I write?

The actual changelog text typically begins with a relevant component name, feature, tool, or other topic, followed by a colon, such as "Payments Block:" or "Sync:".

The rest of the changelog entry is a sentence fragment (beginning with a bare infinitive verb) describing what the PR does. Remember that this is aimed at end users, so be wary of jargon and details of the code. If it helps, think about filling in the blank "This PR will ______".

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

You can find more examples by looking at [prior Jetpack releases](https://github.com/Automattic/jetpack-production/releases).
