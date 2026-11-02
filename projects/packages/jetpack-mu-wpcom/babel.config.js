const config = {
	targets: require( '@automattic/jetpack-webpack-config/targets' ),
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'jetpack-mu-wpcom' } },
		],
	],
	overrides: [
		{
			// Synced newspack-blocks has JSX in `.js` files.
			test: './src/features/newspack-blocks/synced-newspack-blocks',
			presets: [ [ '@babel/preset-react', { runtime: 'automatic' } ] ],
		},
		{
			// The oldest browsers users are stuck on: macOS 10.12 (Chrome 103), Windows 7/8.1 (Firefox 115 ESR),
			// macOS 10.15 and iOS 15 (Safari 15.6). Babel keeps only the core-js modules these lack.
			test: './src/features/browser-polyfills',
			targets: [
				'chrome >= 103',
				'edge >= 103',
				'firefox >= 115',
				'safari >= 15.6',
				'ios_saf >= 15.6',
			],
			presets: [
				[
					'@automattic/jetpack-webpack-config/babel/preset',
					// The default rewrites core-js imports into a wp-polyfill dependency, which lacks most of these.
					{ autoWpPolyfill: false },
				],
			],
			plugins: [
				// The plugin rather than preset-env's useBuiltIns, which Babel 8 removes.
				[
					'babel-plugin-polyfill-corejs3',
					{ method: 'entry-global', version: require( 'core-js/package.json' ).version },
				],
			],
		},
	],
};

module.exports = config;
