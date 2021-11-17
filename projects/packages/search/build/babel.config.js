module.exports = api => {
	api.cache( true );

	return {
		presets: [
			[
				'@automattic/jetpack-webpack-config/babel/preset',
				{
					presetEnv: {
						corejs: '3.8.3',
						modules: false,
						useBuiltIns: 'usage',
					},
				},
			],
		],
	};
};
