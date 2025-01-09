const path = require( 'path' );
const { getCommonConfig, getComponentEntries } = require( './webpack.common.cjs' );

module.exports = {
	...getCommonConfig( true ),
	entry: getComponentEntries(),
	output: {
		path: path.resolve( './', 'dist' ),
		filename: pathData => {
			const name = pathData.chunk.name;
			if ( name === 'index' ) {
				return 'index.js';
			}
			return `${ name }/index.js`;
		},
		library: {
			type: 'module',
		},
		environment: {
			module: true,
		},
	},
	experiments: {
		outputModule: true,
	},
	devtool: 'source-map',
};
