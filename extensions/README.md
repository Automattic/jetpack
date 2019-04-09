# Jetpack Block Editor Extensions

This directory contains the source code for extensions in the new post editor,
also known as Gutenberg, [that was introduced in WordPress 5.0](https://wordpress.org/news/2018/12/bebo/).

## How do I develop block editor extensions in Jetpack?

- Use the [Jetpack Docker environment](https://github.com/Automattic/jetpack/tree/master/docker#readme).
- Start a new branch.
- Add your new extension's files to the extensions/blocks directory.
- Or modify existing extensions in the same folder.
- Run `yarn build-extensions [--watch]` to compile your changes.
- Now test your changes in your docker environment's wp-admin.
- Open a PR, and a WordPress.com diff will be automatically generated with your changes.
- Test the WordPress.com diff
- Once the code works well in both enviornments, and has been approved by a Jetpack crew member, you can merge your branch!

## What if I need to manually create a WordPress.com diff?
You can build extensions from the Jetpack folder to your local sandbox folder and sync the whole sandbox like you always do:

```bash
yarn build-extensions \
  --output-path /PATH_TO_YOUR_SANDBOX/wp-content/mu-plugins/jetpack/_inc/blocks/ \
  --watch
```

Alternatively, if you don’t need to touch PHP files, you can build extensions in the Jetpack folder without --output-path and use rsync to push files directly to your sandbox:


```bash
rsync -a --delete _inc/blocks/ \
YOUR_WPCOM_SANDBOXUSERNAME@YOUR_WPCOM_SANDBOX.wordpress.com:/home/wpcom/public_html/wp-content/mu-plugins/jetpack/_inc/blocks/﻿
```

Calypso loads Gutenberg from simple sites’ wp-admin in an iframe.

## BETA Extenstions
Generally, all new extensions should start out as beta.

- Before you develop, remember to add your extension's slug to the beta array in extensions/index.json.
- Ensure that, in you docker environment, the `JETPACK_BETA_BLOCKS` constant is set to `true`
- In the WordPress.com environment, a12s will be able to see beta extensions with no further configuration
- Once you've sucessfully beta tested your new extension, you can open new PR to make your extension live!
- Simply move the extension's slug out of the beta array and into the production array in extensions/index.json.

## How do I merge extensions to Jetpack
- Jetpack is released once a month, so be sure your team is aware of code freeze schedule (PCYsg-eg5-p2).
- Make sure you and your team have tested your PR in both the Jetpack environment, and the WordPress.com environment.
- Additionally, your PR will require approval from a Jetpack crew member.
- Once merged, your extension will appear in the next release.

## How do I merge extensions to WordPress.com?
- Extensions are continuously deployed to WordPress.com, just like other parts of Jetpack.
- Merge to Jetpack master first.
- Now, merge the auto-generated diff on WordPress.com.
- There's no need to wait on release schedules, in fact it is best if you merge your WordPress.com diff immediately after you've merged to Jetpack master.

## Can I use Jurassic Ninja to test blocks?
Yes! Just like any other changes in Jetpack, also blocks work in Jurassic Ninja.

Simply add branch name to the URL: jurassic.ninja/create/?jetpack-beta&branch=master or use other ninjastic features.

## Extension Type

We define different types of block editor extensions:

- Blocks are available in the editor itself.
- Plugins are available in the Jetpack sidebar that appears on the right side of the block editor.

## Extension Structure

Extensions in the `extensions/blocks` folder loosely follow this structure:

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

## The Build

- Compiled extensions are output to `_inc/blocks`
- You can view the various build commands in package.json
- You can see the build configuration in webpack.config.extensions.js

If you need to modify the build process, bear in mind that config files are also
synced to WordPress.com via Fusion. Consult with a Jetpack crew member to ensure
you test the new build in both environments.
