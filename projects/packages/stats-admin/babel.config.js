const config = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{
				// The script only calls array methods, which the preset mistakes for Iterator helpers.
				autoWpPolyfill: false,
			},
		],
	],
};

module.exports = config;
