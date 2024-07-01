# Help Center

<kbd><img width="417" alt="image" src="https://github.com/Automattic/wp-calypso/assets/17054134/05e99f88-59ea-4303-889c-bd6b9cc52ce7"></kbd>

The Help Center is the main tool our customers use to reach for support.

## Development

The Help Center is a bit complicated because it runs in multiple different environments.

1. In Calypso.
2. In Simple sites
	- as a plugin to Gutenberg editor.
	- as a wpadminbar menu item.
4. In Atomic sites 
	- as a plugin to Gutenberg editor.
		- A plugin when the site is connected to Jetpack.
		- A minimal plugin when the site is disconnected from Jetpack. This plugiy simple links to wp.com/help.
	- as a wpadminbar menu item.
		- A menu item that opens the Help Center when connected to Jetpack.
		- A minimal plugin when the site is disconnected from Jetpack. This plugiy simple links to wp.com/help.

### How to develop the Help Center

#### In Calypso

Follow the classic Calypso development setup. Run `yarn start` and edit away. Nothing else should be needed.

#### In Simple sites

0. Go to Calypso repository root.
1. cd into `packages/help-center`.
2. run `yarn dev --sync`.
3. Sandbox your site and `widgets.wp.com`.
4. Your changes should be reflected on the site live.

#### In Atomic sites

If you're making changes to JS and CSS files in Calypso (widgets.wp.com), you can follow the same instructions of Simple sites. **Be proxied during development so Jetpack gives JS files random cache busters**.

If you're making changes to PHP files, use the normal `jetpack-mu-wpcom` development flow.

> [!IMPORTANT]
> If you make changes to the *.asset.json files, i.e add or remove dependencies, these files won't be synced with the site as Jetpack pulls these files via network. And since Jetpack pulls from production and not your sandbox, you'll have to deploy first for these changes to take effect.

If you do want to modify PHP files. Please follow the development process of [`jetpack-mu-plugin`](https://github.com/Automattic/jetpack/blob/trunk/projects/packages/jetpack-mu-wpcom/README.md).

### Translations

Translation are download from `widgets.wp.com/help-center/languages` during `jetpack-mu-plugin` build process. Please cd into `projects/packages/jetpack-mu-wpcom` and run:

1. pnpm run build-production-js
2. jetpack rsync mu-wpcom-plugin

This will update the translations files.

### Deployment

After every change to the Help Center PHP files, you'll have to deploy `jetpack-mu-plugin`.

> [!IMPORTANT]
> If you add new phrases to the Help Center. They will only be translated in Atomic sites after `jetpack-mu-plugin` is released. Which happens twice a day.
