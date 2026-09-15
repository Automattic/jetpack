import targets from '@automattic/jetpack-webpack-config/targets';

const config = {
	targets,
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'jetpack-my-jetpack' } },
		],
	],
};

export default config;
