module.exports = {
	targets: require( '@automattic/jetpack-webpack-config/targets' ),
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{
				/* options */
			},
		],
	],
};
