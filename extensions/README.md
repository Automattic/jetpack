# Jetpack Block Editor Extensions

This directory contains the source code for extensions in the block editor,
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
	├── view.js                  ← script loaded on the frontend
	└── view.scss                ← styles loaded on the frontend
```

If your block depends on another block, place them all in extensions folder:

```
.
├── block-name/
└── sub-blockname/
```

## Developing block editor extensions in Jetpack

### High-level overview of the development flow

1. Use the [Jetpack Docker environment](https://github.com/Automattic/jetpack/tree/master/docker#readme).
1. Start a new branch.
1. Add your new extension's source files to the extensions/blocks directory.
And add your extensions' slug to the beta array in `extensions/index.json`. You can use Jetpack-CLI command to scaffold the block (see below).
By keeping your extension in the beta array, it's safe to do small PRs and merge frequently.
1. Or modify existing extensions in the same folder.
1. Run `yarn build-extensions [--watch]` to compile your changes.
1. Now test your changes in your Docker environment's wp-admin.
1. Open a PR, and a WordPress.com diff will be automatically generated with your changes.
1. Test the WordPress.com diff
1. Once the code works well in both environments and has been approved by a Jetpack crew member, you can merge your branch!
1. When your block is ready to be shipped, move your extensions' slug from beta to production array in `extensions/index.json`

### Beta Extensions

Generally, all new extensions should start out as a beta.

- Before you develop, remember to add your extension's slug to the beta array in `extensions/index.json`.
- In the `wp-config.php` for your Docker environment (`docker/wordpress/wp-config.php`) or in your custom mu-plugins file (`docker/mu-plugins/yourfile.php`), enable beta extensions with the following snippet: `define( 'JETPACK_BETA_BLOCKS', true );`
- When you use this constant, you'll get all blocks: Beta blocks, Experimental blocks, and Production blocks.
- In the WordPress.com environment, Automatticians will be able to see beta extensions with no further configuration
- In a Jurassic Ninja site, you must go to Settings > Jetpack Constants, and enable the `JETPACK_BETA_BLOCKS` option there.
- Once you've successfully beta tested your new extension, you can open new PR to make your extension live!
- Simply move the extension's slug out of the beta array and into the production array in `extensions/index.json`.

### Experimental Extensions

We also offer an "experimental" state for extensions. Those extensions will be made available to anyone having the `JETPACK_EXPERIMENTAL_BLOCKS` constant defined in `wp-config.php`. When you use this constant, you'll get Experimental blocks as well as Production blocks.

Experimental extensions are usually considered ready for production, but are served only to sites requesting them.

### Scaffolding blocks with WP-CLI

We have a command in WP-CLI that allows to scaffold Jetpack blocks. Its syntax is as follows:

`wp jetpack scaffold <type> <title> [--slug] [--description] [--keywords] [--variation]`

**Currently the only `type` is `block`.**

#### Options

- **title**: Block name, also used to create the slug. This parameter is required. If it's something like _Logo gallery_, the slug will be `logo-gallery`. It's also used to generate the class name when an external edit component is requested. Following this example, it would be `LogoGalleryEdit`.
- **--slug**: Specific slug to identify the block that overrides the one generated base don the title.
- **--description**: Allows to provide a text description of the block.
- **--keywords**: Provide up to three keywords separated by a comma so users when they search for a block in the editor.
- **--variation**: Allows to decide whether the block should be a production block, experimental, or beta. Defaults to Beta when arg not provided.

#### Files

All files will be created in a directory under `extensions/blocks/` named after the block title or a specific given slug. For a hypothetical **Jukebox** block, it will create the following files

- `extensions/blocks/jukebox/`
- `extensions/blocks/jukebox/jukebox.php`
- `extensions/blocks/jukebox/index.js`
- `extensions/blocks/jukebox/editor.js`
- `extensions/blocks/jukebox/editor.scss`
- `extensions/blocks/jukebox/edit.js`

Additionally, the slug of the new block will be added to the `beta` array in the file `extensions/index.json`.
Since it's added to the beta array, you need to load the beta blocks as explained above to be able to test this block.

#### Examples

`wp jetpack scaffold block "Cool Block"`

`wp jetpack scaffold block "Amazing Rock" --slug="good-music" --description="Rock the best music on your site"`

`wp jetpack scaffold block "Jukebox" --keywords="music, audio, media"`

`wp jetpack scaffold block "Jukebox" --variation="experimental"`

### Testing

Run `yarn test-extensions [--watch]` to run tests written in [Jest](https://jestjs.io/en/).

Note that adding [Jest snapshot tests](https://jestjs.io/docs/en/snapshot-testing) for block's `save` methods is problematic because many core packages relying on `window` that is not present when testing with Jest. See [prior exploration](https://github.com/Automattic/wp-calypso/pull/30727).

#### Can I use Jurassic Ninja to test blocks?

Yes! Just like any other changes in Jetpack, also blocks work in Jurassic Ninja.

Simply add branch name to the URL: jurassic.ninja/create/?jetpack-beta&branch=master or use other ninjastic features.

## Deploying extensions

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

To test extensions for a Simple site in Calypso, sandbox the simple site URL (`example.wordpress.com`). Calypso loads Gutenberg from simple sites’ wp-admin in an iframe.

## Paid blocks

Blocks can be restricted to specific paid plans in both WordPress.com and Jetpack. When registering a block using `jetpack_register_block`, pass `plan_check => true` as a key in the second argument. When the block is registerd we check the plan data to see if the user's plan supports this block. For example:

```php
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\load_assets',
			'plan_check'      => true,
		)
	);
}
```

Sometimes blocks are paid for WordPress.com users but free for Jetpack users. In these cases it is still necessary to add the block to the plan data for both environments, for example:

```php
const PLAN_DATA = array(
	'free'     => array(
		'plans'    => array(
			'jetpack_free',
		),
		'supports' => array(
			'opentable',
			'calendly',
		),
	),
```

The plan data is found in `class.jetpack-plan.php` for Jetpack and an example of adding the features to WordPress.com plans is in D43206-code.

### Upgrades
Paid blocks that aren't supported by a user's plan will still be registered for use in the block editor, but will not be displayed by default.

You can, however, use the following filter:

```php
add_filter( 'jetpack_block_editor_enable_upgrade_nudge', '__return_true' );
```

This will allow you to take advantage of those registered blocks. They will not be rendered to logged out visitors on the frontend of the site, but the block will be available in the block picker in the editor. When you add a paid block to a post, an `UpgradeNudge` component will display above the block in the editor and on the front end of the site to inform users that this is a paid block.

### Terminology
Blocks can be registered but not available:
- Registered: The block appears in the block inserter
- Available: The block is included in the user's current plan and renders in the front end of the site

## Good to know when developing Gutenberg extensions

### The Build

- Compiled extensions are output to `_inc/blocks`
- You can view the various build commands in `package.json`
- You can see the build configuration in `webpack.config.extensions.js`

If you need to modify the build process, bear in mind that config files are also
synced to WordPress.com via Fusion. Consult with a Jetpack crew member to ensure
you test the new build in both environments.

### Debugging

Setting these might be useful for debugging with block editor:

```php
define( 'SCRIPT_DEBUG', true );
define( 'GUTENBERG_DEVELOPMENT_MODE', true );
```

You could modify `SCRIPT_DEBUG` from `docker/wordpress/wp-config.php` in your Docker environment and add `GUTENBERG_DEVELOPMENT_MODE` there as well, or in your custom mu-plugins file (`docker/mu-plugins/yourfile.php`).

[G Debugger](https://wordpress.org/plugins/g-debugger/) plugin might come handy, too.

### Don't worry about dependencies

The build takes care of core dependencies for both editor and view scripts. React, Lodash and `@wordpress/*` [dependencies](https://github.com/WordPress/gutenberg/blob/master/docs/contributors/scripts.md) are externalized and automatically enqueued in PHP for your extension.

Extensions _always_ get [Gutenberg's polyfill scripts](https://github.com/WordPress/gutenberg/blob/master/docs/contributors/scripts.md#polyfill-scripts) enqueued so you can safely use methods not supported by older browsers such as IE11.

### Jetpack plugin sidebar

Jetpack adds its own [plugin sidebar](https://wordpress.org/gutenberg/handbook/designers-developers/developers/tutorials/plugin-sidebar-0/plugin-sidebar-1-up-and-running/) to the block editor. You can find it by choosing "Jetpack" from block the editor's ellipsis menu or by pressing the Jetpack icon in the "pinned plugins" toolbar.

The sidebar itself is always registered in the editor and populated using the [Slot Fill](https://github.com/WordPress/gutenberg/tree/master/packages/components/src/slot-fill#readme) mechanism.

Use the `JetpackPluginSidebar` component to render from anywhere in your plugin's code:

```jsx
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';

<JetpackPluginSidebar>
	<PanelBody title={ __( 'My sidebar section', 'jetpack' ) }>
		<p>Jetpack is Bestpack!</p>
	</PanelBody>
</JetpackPluginSidebar>
```

The sidebar won't show up at all if nothing is being rendered in the sidebar's "slot".

Remember to be mindful of what post types you want to enable your sidebar section for: e.g. posts, pages, custom post types, and re-usable block post type (`/wp-admin/edit.php?post_type=wp_block`).

See [Publicize](blocks/publicize/index.js) and [Shortlinks](blocks/shortlinks/index.js) for examples how to limit functionality only to some specific post types or posts. The [Likes](blocks/likes/likes-checkbox.js) & [Sharing](blocks/sharing/sharing-checkbox.js) extensions are a great example of how to [output](shared/jetpack-likes-and-sharing-panel.js) content from several extensions to one sidebar section using "slots".

### i18n

`@wordpress/i18n` doesn't support React elements in strings, but you can use `createInterpolateElement` from `@wordpress/element`. However, since `createInterpolateElement` is only available in WordPress 5.5+, you will need to use `jetpackCreateInterpolateElement` instead to avoid issues on older versions of WordPress.

```jsx
import { BlockIcon } from '@wordpress/block-editor';
import { jetpackCreateInterpolateElement } from '../../shared/create-interpolate-element';
const getDocumentationLink = () => {
	return jetpackCreateInterpolateElement(
		__( '<FlagIcon /> Still confused? <a>Check out documentation for more!</a>', 'jetpack' ),
		{
			FlagIcon: <BlockIcon icon="flag" />,
			a: <a href="https://jetpack.com" />,
		}
	);
};
```

### Colors

To stay consistent with Gutenberg, your extensions should follow [Gutenberg styles and visuals](https://wordpress.org/gutenberg/handbook/designers-developers/designers/block-design/).

Use Gutenberg color variables where possible by importing `extensions/shared/styles/gutenberg-base-styles.scss`, which in turn imports all variables and mixins published in [`@wordpress/base-styles`](https://github.com/WordPress/gutenberg/tree/983c60f25e4bdb7432fde7afdf2b4cc16640f01e/packages/base-styles) package.

The build pipeline also supports [Color studio](https://github.com/Automattic/color-studio) via SASS variables (`$studio-pink-50`) and CSS custom properties (`var( --studio-pink-50 )`) without specifically importing them first. Prefer CSS custom properties when possible.

### Icons

Please use outline versions of [Material icons](https://material.io/tools/icons/?style=outline) to stay in line with Gutenberg. Don't rely on icons used in WordPress core to avoid visual mixing up with core blocks.

## Native support

This is still very much experimental and subject to change.
React Native support for Jetpack blocks is being added as part of the WordPress [Android](https://github.com/wordpress-mobile/WordPress-Android) and [iOS](https://github.com/wordpress-mobile/WordPress-iOS) apps.
A react-native build configuration will attempt to resolve `.native.js` extensions before `.js` ones, making `.native.js` a simple approach to write "cross-platform" gutenberg blocks.
