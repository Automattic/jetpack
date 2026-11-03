# Newspack Blocks

Some of the Newspack blocks were added to this repository so they would be available to other parts of the FSE plugin where these blocks will be used, such as Starter Page Templates.

## Block Posts Block

This block allows you to list your posts in various layouts and filter them by criteria like category, tag or author.

It originally comes from the Newspack Blocks collection and is still developed as the `homepage-articles` block in [`Automattic/newspack-workspace`](https://github.com/Automattic/newspack-workspace/tree/main/plugins/newspack-blocks).

## Carousel Block

This block allows you to create a carousel of post featured images and filter them by criteria (e.g. category, tag or author).

It originally comes from the Newspack Blocks collection and is still developed as the `carousel` block in [`Automattic/newspack-workspace`](https://github.com/Automattic/newspack-workspace/tree/main/plugins/newspack-blocks).

## Structure

```
index.php — main entry file, registers the blocks on backend
blog-posts/ — assets for the blog-posts block frontend and editor
carousel/ — assets for the carousel block frontend and editor
synced-newspack-blocks/ — source code synced from the Newspack Blocks repository
```

Other than the `synced-newspack-blocks` directory, the above are files written in order to bridge the parent plugin with Newspack Blocks. They change the block names to an `a8c/` namespace and register REST fields, styles, and scripts. In these files we are free to make changes because they are not shared with Newspack and only live here in this repository.


### Synchronizing the code

The `synced-newspack-blocks` directory is synced from `plugins/newspack-blocks` in the [`Automattic/newspack-workspace`](https://github.com/Automattic/newspack-workspace) monorepo. *Please make all improvements and additions upstream there. Do not make any direct changes to files in this directory, as the next synchronization will overwrite them.*

Newspack Blocks used to live in its own `Automattic/newspack-blocks` repository, which is archived; its final release was 4.26.6. Releases are now tagged `newspack-blocks@<version>` in the workspace, and each one still attaches the `newspack-blocks.zip` artifact the sync script downloads.

Once your changes land upstream, coordinate with the team (over issues/PRs) to [make a new release](https://github.com/Automattic/newspack-workspace/releases?q=newspack-blocks). Once you have the version (e.g. `4.30.3`), you start a sync.

While in the `projects/packages/jetpack-mu-wpcom` directory, run the following:

```
pnpm run sync:newspack-blocks --release=<THE VERSION>
```

This will pull the code from the release into this repository and perform the following tasks:
* Copies TypeScript types into place.
* Changes JS and PHP textdomain refs to `jetpack-mu-wpcom`.
* Adjusts JS translation function calls to avoid minification issues.
* Checks for potential places where `ENT_COMPAT` should be used.

Once the script has completed:
1. Ensure the changes shown match the changes in the release.
2. Commit.

### Local development

Sometimes, probably, you will need to sync the code straight in your local environment. It means you will get working on both projects at the same time. For this situation, you'd like to reference the code source through the `path` bin script argument.

```
pnpm run sync:newspack-blocks --path=/Absolute/path/of/newspack-workspace/plugins/newspack-blocks/
```
