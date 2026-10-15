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
	],
};

module.exports = config;
