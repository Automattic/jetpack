# Jetpack Block Editor Extensions

This directory lists extensions for the Block Editor, also known as Gutenberg,
[that was introduced in WordPress 5.0](https://wordpress.org/news/2018/12/bebo/).

## How do I develop blocks in Jetpack?

- Use the [Jetpack Docker environment](https://github.com/Automattic/jetpack/tree/master/docker#readme).
- Modify files in extensions/ directory.
- To build blocks run `yarn build-extensions` [--watch].
- Jetpack wp-admin should be your primary way to develop and test blocks
- Then test them on WPCOM before deploying.

## How do I develop with WPCOM / Calypso?
You can build blocks from the Jetpack folder to your local sandbox folder and sync the whole sandbox like you always do:

```bash
yarn build-extensions \
  --output-path /PATH_TO_YOUR_SANDBOX/wp-content/mu-plugins/jetpack/_inc/blocks/ \
  --watch
```

Alternatively, if you don’t need to touch PHP files, you can build blocks in the Jetpack folder without --output-path and use rsync to push files directly to your sandbox:


```bash
rsync -a --delete _inc/blocks/ \
YOUR_WPCOM_SANDBOXUSERNAME@YOUR_WPCOM_SANDBOX.wordpress.com:/home/wpcom/public_html/wp-content/mu-plugins/jetpack/_inc/blocks/﻿
```

Calypso loads Gutenberg from simple sites’ wp-admin in an iframe.

## BETA BLOCKS
Explain beta blocks process here

## How do I merge blocks to Jetpack
- All Jetpack patches need a review from the Jetpack Crew team
- Jetpack is released once a month (PCYsg-eg5-p2)
- TODO

## How do I deploy to wpcom?
- merge to Jetpack master first
- sync the blocks using Fusion (PCYsg-fkM-p2)
- TODO

## Can I use Jurassic Ninja to test blocks?
Yes! Just like any other changes in Jetpack, also blocks work in Jurassic Ninja.

Simply add branch name to the URL: jurassic.ninja/create/?jetpack-beta&branch=master or use other ninjastic features.

## Extension Type

We define different types of block editor extensions:

- Blocks are available in the editor itself.
- Plugins are available in the Jetpack sidebar that appears on the right side of the block editor.

## Extension Structure

Extensions loosely follow this structure:

```
.
└── block-or-plugin-name/
	├── block-or-plugin-name.php ← PHP file where the block and its assets are registered.
	├── editor.js                ← script loaded only in the editor
	├── editor.scss              ← styles loaded only in the editor
	├── view.js                  ← script loaded in the editor and theme
	└── view.scss                ← styles loaded in the editor and theme
```

If your block depends on another block, place them all in extensions folder:

```
.
├── block-name/
└── sub-blockname/
```

Notes:

Remember to add any block-related files (including Webpack and Babel build scripts) to Fusion so that blocks can be built on wpcom as well.

(we should document that somewhere and add link to docs above those lines in `build-plugin-files.php`)
