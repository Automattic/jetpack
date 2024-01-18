module.exports = {
	plugins: [
		[
			'@babel/plugin-transform-react-jsx',
			{
				pragma: 'h',
				pragmaFrag: 'Fragment',
			},
		],
	],
	presets: [ [ '@automattic/jetpack-webpack-config/babel/preset' ] ],
};
