const path = require( 'path' );

module.exports = {
	entry: './src/js/index.js',
	output: {
		filename: 'main.js',
		path: path.resolve( __dirname, 'build' ),
	},
	module: {
		rules: [
			{
				test: /\.(jsx|js)$/,
				include: path.resolve( __dirname, 'src/js' ),
				exclude: /node_modules/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: [
								[
									'@babel/preset-env',
									{
										targets: 'defaults',
									},
								],
								'@babel/preset-react',
							],
						},
					},
				],
			},
		],
	},
};
