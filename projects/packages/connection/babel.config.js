const config = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'jetpack-connection' } },
		],
	],
	overrides: [
		// The Connectors card is a script module, which can't depend on the classic wp-polyfill script.
		{
			test: /\/connectors\//,
			presets: [
				[
					'@automattic/jetpack-webpack-config/babel/preset',
					{
						autoWpPolyfill: false,
						pluginReplaceTextdomain: { textdomain: 'jetpack-connection' },
					},
				],
			],
		},
	],
};

module.exports = config;
