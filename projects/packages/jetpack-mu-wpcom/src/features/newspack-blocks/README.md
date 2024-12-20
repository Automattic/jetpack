# Newspack Blocks

Some of the Newspack blocks were added to this repository so they would be available to other parts of the FSE plugin where these blocks will be used, such as Starter Page Templates.

## Block Posts Block

This block allows you to list your posts in various layouts and filter them by criteria like category, tag or author.

It originally comes from the [Newspack Blocks collection](https://github.com/automattic/newspack-blocks) and the block is still being developed there as the `homepage-articles` block.

## Carousel Block

This block allows you to create a carousel of post featured images and filter them by criteria (e.g. category, tag or author).

It originally comes from the [Newspack Blocks collection](https://github.com/automattic/newspack-blocks) and the block is still being developed there as the `carousel` block.

## Structure

```
index.php — main entry file, registers the blocks on backend
blog-posts/ — assets for the blog-posts block frontend and editor
carousel/ — assets for the carousel block frontend and editor
synced-newspack-blocks/ — source code synced from the Newspack Blocks repository
```

Other than the `synced-newspack-blocks` directory, the above are files written in order to bridge the parent plugin with Newspack Blocks. They change the block names to an `a8c/` namespace and register REST fields, styles, and scripts. In these files we are free to make changes because they are not shared with Newspack and only live here in this repository.


### Synchronizing the code

The `synced-newspack-blocks` is synced with the Newspack Blocks repository. *Please make all improvements and additions upstream in the Newspack Blocks repo. Do not make any direct changes to files in this directory, as the next synchronization will overwrite them.*

Once your changes land in the Newspack Blocks repo, coordinate with the team (over issues/PRs) to [make a new release](https://github.com/Automattic/newspack-blocks/releases). Once you have the release ID (e.g. `v4.0.0`, you start a sync.

While in the `projects/packages/jetpack-mu-wpcom` directory, run the following:

```
pnpm run sync:newspack-blocks --release=<THE RELEASE ID>
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
pnpm run sync:newspack-blocks --path=/Absolute/path/of/newspack-blocks/
```
