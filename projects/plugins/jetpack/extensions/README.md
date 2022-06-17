# Jetpack Block Editor Extensions

This directory contains the source code for extensions in the block editor,
also known as Gutenberg, [that was introduced in WordPress 5.0](https://wordpress.org/news/2018/12/bebo/).

## Extension Type

We define different types of block editor extensions:

### Blocks
Blocks are available in the editor itself.
Located in the `./blocks` folder.

### Extended blocks
Blocks, usually core blocks, extended by Jetpack plugin.
Located in the `./extended-blocks` folder.

### Plugins
Core Editor [plugins](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-plugins/), 
registered by Jetpack to extend the application UI via [Slot&Fill](https://developer.wordpress.org/block-editor/reference-guides/slotfills/) components.

## Extension Structure

Extensions in the `extensions/` folder loosely follow this structure:

```txt
.
├── blocks/
│   └── block-name/
│		├── editor.js                ← script loaded only in the editor
│		├── editor.scss              ← styles loaded only in the editor
│		├── view.js                  ← script loaded on the frontend
│		└── view.scss                ← styles loaded on the frontend
│
├── extended-blocks/
│   └── block-name/
│		├── index.js                 ← entry point to extend.
│		└── ...
│
├── plugins/
│   └── plugin-name/
│		├── index.js                 ← plugin registration
│		└── ...
│
└── store/
	└── store-name/
		├── index.js                 ← plugin definition
		└── ...
```

If your block depends on another block, place them all in extensions folder:

```txt
.
└── blocks/
	├── block-name/
	└── sub-blockname/
```

## Developing block editor extensions in Jetpack

### High-level overview of the development flow

1. Use the [Jetpack Docker environment](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md#readme).
1. Start a new branch.
1. Add your new extension's source files to the extensions directory.
And add your extensions' slug to the beta array in `extensions/index.json`. You can use Jetpack-CLI command to scaffold the block (see below).
By keeping your extension in the beta array, it's safe to do small PRs and merge frequently.
1. Or modify existing extensions in the same folder.
1. Run `pnpm build-extensions [--watch]` to compile your changes.
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

Run `pnpm test-extensions [--watch]` to run tests written in [Jest](https://jestjs.io/en/).

Note that adding [Jest snapshot tests](https://jestjs.io/docs/en/snapshot-testing) for block's `save` methods is problematic because many core packages relying on `window` that is not present when testing with Jest. See [prior exploration](https://github.com/Automattic/wp-calypso/pull/30727).

#### Can I use Jurassic Ninja to test blocks?

Yes! Just like any other changes in Jetpack, also blocks work in Jurassic Ninja.

Simply add branch name to the URL: jurassic.ninja/create/?jetpack-beta&branches.jetpack=trunk or use other ninjastic features.

## Deploying extensions

### How do I merge extensions to Jetpack

- Jetpack is released once a month, so be sure your team is aware of [upcoming code freezes](https://github.com/Automattic/Jetpack/milestones).
- Make sure you and your team have tested your PR in both the Jetpack environment, and the WordPress.com environment.
- Additionally, your PR will require approval from a Jetpack crew member.
- Once merged, your extension will appear in the next release.

### How do I merge extensions to WordPress.com?

- Merge to Jetpack trunk first.
- Then, merge the auto-generated diff on WordPress.com.
- Note: before merging your WordPress.com diff, it is worth considering the release schedule if you are shipping a new feature. This is to avoid a situation where a new feature ends up on WordPress.com before anywhere else, and any subsequent site migrations mean that functionality is lost. Reach out to a Jetpack crew member if in doubt.

### What if I need to manually create a WordPress.com diff?

You can build extensions from the Jetpack folder to your local sandbox folder and sync the whole sandbox like you always do:

```bash
pnpm clean-extensions
pnpm build-extensions \
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

Blocks can be restricted to specific paid plans in both WordPress.com and Jetpack. When registering a block using `Blocks::jetpack_register_block`, pass `plan_check => true` as a key in the second argument. When the block is registered we check the plan data to see if the user's plan supports this block. For example:

```php
use Automattic\Jetpack\Blocks;
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\load_assets',
			'plan_check'      => true,
		)
	);
}
```

This approach applies to both blocks and sidebar extensions.

Sometimes blocks are paid for WordPress.com users but free for Jetpack users. In these cases it is still necessary to add the block to the plan data for _both_ environments, for example:

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

### Upgrades for Blocks
Paid blocks that aren't supported by a user's plan will still be registered for use in the block editor, but will not be displayed by default.

You can, however, use the following filter:

```php
add_filter( 'jetpack_block_editor_enable_upgrade_nudge', '__return_true' );
```

This will allow you to take advantage of those registered blocks. They will not be rendered to logged out visitors on the frontend of the site, but the block will be available in the block picker in the editor. When you add a paid block to a post, an `UpgradeNudge` component will display above the block in the editor and on the front end of the site to inform users that this is a paid block. If a paid block is nested within another paid block, only the parent block will display its upgrade nudge on the front end.

### Upgrades for Jetpack sidebar extensions

Unlike blocks, adding an extension for the Jetpack sidebar requires calling `registerJetpackPlugin` (a high level wrapper around Gutenberg's `registerPlugin`) to register the Plugin with Gutenberg.

This function [contains a conditional which checks whether the extension is available on the current plan](https://github.com/Automattic/jetpack/blob/f76d346a180c65a45aaf8be5802ae03d0e8d3355/extensions/shared/register-jetpack-plugin.js#L19-L22) and if it is not then the Plugin is _not_ registered and will not be available in the Jetpack sidebar.

This means that for extensions which are gated by Plan, users who are _not_ on the appropriate plan will not know they are missing out on the extension.

Therefore, in a similar way to ["Upgrades for Blocks"](#upgrades-for-blocks) you may wish to provide a fallback experience (eg: an upgrade nudge) for users who are not on an appropriate plan.

To do this, you can check whether your extension is available on the current plan using the [`getJetpackExtensionAvailability` helper function](https://github.com/Automattic/jetpack/blob/f76d346a180c65a45aaf8be5802ae03d0e8d3355/extensions/shared/get-jetpack-extension-availability.js) and if it is _not_ available then you can conditionally register a fallback extension _directly with Gutenberg_ by calling `registerPlugin`. This bypasses the availability checks and ensures your fallback experience is always rendered _if_ the user is not on an appropriate plan.

An example of this pattern is provided below:

```jsx
const extensionName = 'my-extension-name';

/*
 * Register the main "social-previews" extension if the feature is available
 * on the current plan.
 */
registerJetpackPlugin( extensionName, {
	render: () => <MyExtensionComponent />
} );

/*
 * If the social previews extension is not available on this plan (WP.com only)
 * then manually register a near identical Plugin which shows the upgrade nudge.
 */
const extensionAvailableOnPlan = getJetpackExtensionAvailability( 'social-previews' )?.available;

if ( ! extensionAvailableOnPlan ) {
	/*
	 * When registering directly we must manually prepend the 'jetpack-'
	 * prefix to the block slug and the `-fallback` suffix in order to
	 * identify it as the fallback extension.
	 */
	registerPlugin( `jetpack-${ extensionName }-fallback`, {
		render: <MyExtensionComponent isFallback={true} />
	} );
}
```

For a working example please see the [Social Previews extension](https://github.com/Automattic/jetpack/blob/f76d346a180c65a45aaf8be5802ae03d0e8d3355/extensions/blocks/social-previews/editor.js):


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

The build takes care of core dependencies for both editor and view scripts. React, Lodash and `@wordpress/*` [dependencies](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/scripts.md) are externalized and automatically enqueued in PHP for your extension.

Extensions _always_ get [Gutenberg's polyfill scripts](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/scripts.md#polyfill-scripts) enqueued so you can safely use methods not supported by older browsers such as IE11.

### Jetpack plugin sidebar

Jetpack adds its own [plugin sidebar](https://wordpress.org/gutenberg/handbook/designers-developers/developers/tutorials/plugin-sidebar-0/plugin-sidebar-1-up-and-running/) to the block editor. You can find it by choosing "Jetpack" from block the editor's ellipsis menu or by pressing the Jetpack icon in the "pinned plugins" toolbar.

The sidebar itself is always registered in the editor and populated using the [Slot Fill](https://github.com/WordPress/gutenberg/tree/trunk/packages/components/src/slot-fill#readme) mechanism.

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

`@wordpress/i18n` doesn't support React elements in strings, but you can use `createInterpolateElement` from `@wordpress/element`. 

### Colors

To stay consistent with Gutenberg, your extensions should follow [Gutenberg styles and visuals](https://wordpress.org/gutenberg/handbook/designers-developers/designers/block-design/).

Use Gutenberg color variables where possible by importing `@automattic/jetpack-base-styles/gutenberg-base-styles`, which in turn imports all variables and mixins published in [`@wordpress/base-styles`](https://github.com/WordPress/gutenberg/tree/983c60f25e4bdb7432fde7afdf2b4cc16640f01e/packages/base-styles) package.

The build pipeline also supports [Color studio](https://github.com/Automattic/color-studio) via SASS variables (`$studio-pink-50`) and CSS custom properties (`var( --studio-pink-50 )`) without specifically importing them first. Prefer CSS custom properties when possible.

### Icons

Please use outline versions of [Material icons](https://material.io/tools/icons/?style=outline) to stay in line with Gutenberg. Don't rely on icons used in WordPress core to avoid visual mixing up with core blocks.

## Native support

This is still very much experimental and subject to change.
React Native support for Jetpack blocks is being added as part of the WordPress [Android](https://github.com/wordpress-mobile/WordPress-Android) and [iOS](https://github.com/wordpress-mobile/WordPress-iOS) apps.
A react-native build configuration will attempt to resolve `.native.js` extensions before `.js` ones, making `.native.js` a simple approach to write "cross-platform" gutenberg blocks.
