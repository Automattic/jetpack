module.exports = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'jetpack-admin-ui' } },
		],
	],
};
