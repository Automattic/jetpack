# Jetpack Block Editor Extensions

This directory contains the source code for extensions in the new post editor,
also known as Gutenberg, [that was introduced in WordPress 5.0](https://wordpress.org/news/2018/12/bebo/).

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

## Developing block editor extensions in Jetpack

### High level overview of the development flow

1. Use the [Jetpack Docker environment](https://github.com/Automattic/jetpack/tree/master/docker#readme).
1. Start a new branch.
1. Add your new extension's source files to the extensions/blocks directory.
And add your extensions's slug the appropriate array in `extensions/index.json`.
1. Or modify existing extensions in the same folder.
1. Run `yarn build-extensions [--watch]` to compile your changes.
1. Now test your changes in your docker environment's wp-admin.
1. Open a PR, and a WordPress.com diff will be automatically generated with your changes.
1. Test the WordPress.com diff
1. Once the code works well in both environments and has been approved by a Jetpack crew member, you can merge your branch!

### Beta Extensions
Generally, all new extensions should start out as beta.

- Before you develop, remember to add your extension's slug to the beta array in `extensions/index.json`.
- Ensure that, in you docker environment, the `JETPACK_BETA_BLOCKS` constant is set to `true`
- In the WordPress.com environment, a12s will be able to see beta extensions with no further configuration
- Once you've successfully beta tested your new extension, you can open new PR to make your extension live!
- Simply move the extension's slug out of the beta array and into the production array in `extensions/index.json`.

### Can I use Jurassic Ninja to test blocks?
Yes! Just like any other changes in Jetpack, also blocks work in Jurassic Ninja.

Simply add branch name to the URL: jurassic.ninja/create/?jetpack-beta&branch=master or use other ninjastic features.

### How do I merge extensions to Jetpack
- Jetpack is released once a month, so be sure your team is aware of [upcoming code freezes](https://github.com/Automattic/Jetpack/milestones).
- Make sure you and your team have tested your PR in both the Jetpack environment, and the WordPress.com environment.
- Additionally, your PR will require approval from a Jetpack crew member.
- Once merged, your extension will appear in the next release.

### How do I merge extensions to WordPress.com?
- Merge to Jetpack master first.
- Now, merge the auto-generated diff on WordPress.com.
- There's no need to wait on release schedules, in fact it is best if you merge your WordPress.com diff immediately after you've merged to Jetpack master.

### What if I need to manually create a WordPress.com diff?
You can build extensions from the Jetpack folder to your local sandbox folder and sync the whole sandbox like you always do:

```bash
yarn clean-extensions
yarn build-extensions \
  --output-path /PATH_TO_YOUR_SANDBOX/wp-content/mu-plugins/jetpack/_inc/blocks/ \
  --watch
```

Alternatively, if you don’t need to touch PHP files, you can build extensions in the Jetpack folder without --output-path and use rsync to push files directly to your sandbox:


```bash
rsync -az --delete _inc/blocks/ \
  YOUR_WPCOM_SANDBOX:/BLOCKS_PATH_IN_YOUR_SANDBOX/
```

To test extensions for a Simple site in Calypso, sandbox the simple site URL (example.wordpress.com). Calypso loads Gutenberg from simple sites’ wp-admin in an iframe.


## The Build

- Compiled extensions are output to `_inc/blocks`
- You can view the various build commands in `package.json`
- You can see the build configuration in `webpack.config.extensions.js`

If you need to modify the build process, bear in mind that config files are also
synced to WordPress.com via Fusion. Consult with a Jetpack crew member to ensure
you test the new build in both environments.

## Scaffolding blocks with WP-CLI

We have a command in WP-CLI that allows to scaffold Jetpack blocks. Its syntax is as follows:

`wp jetpack scaffold <type> <title> [--slug] [--description] [--keywords]`

**Currently the only `type` is `block`.**

### Options

- **title**: Block name, also used to create the slug. This parameter is required. If it's something like _Logo gallery_, the slug will be `logo-gallery`. It's also used to generate the class name when an external edit component is requested. Following this example, it would be `LogoGalleryEdit`.
- **--slug**: Specific slug to identify the block that overrides the one generated base don the title.
- **--description**: Allows to provide a text description of the block.
- **--keywords**: Provide up to three keywords separated by comma so users  when they search for a block in the editor.

### Files

All files will be created in a directory under `extensions/blocks/` named after the block title or a specific given slug. For a hypothetical **Jukebox** block, it will create the following files

- `extensions/blocks/jukebox/`
- `extensions/blocks/jukebox/jukebox.php`
- `extensions/blocks/jukebox/index.js`
- `extensions/blocks/jukebox/editor.js`
- `extensions/blocks/jukebox/editor.scss`
- `extensions/blocks/jukebox/edit.js`

Additionally, the slug of the new block will be added to the `beta` array in the file `extensions/index.json`.
Since it's added to the beta array, you need to load the beta blocks as explained above to be able to test this block.

### Examples

`wp jetpack scaffold block "Cool Block"`

`wp jetpack scaffold block "Amazing Rock" --slug="good-music" --description="Rock the best music on your site"`

`wp jetpack scaffold block "Jukebox" --keywords="music, audio, media"`

