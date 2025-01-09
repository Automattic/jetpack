const path = require( 'path' );
const { getCommonConfig, getComponentEntries } = require( './tools/webpack.common.cjs' );

module.exports = {
	...getCommonConfig( false ),
	entry: getComponentEntries(),
	output: {
		path: path.resolve( './', 'dist/cjs' ),
		filename: pathData => {
			const name = pathData.chunk.name;
			if ( name === 'index' ) {
				return 'index.js';
			}
			return `${ name }/index.js`;
		},
		library: {
			type: 'commonjs2',
		},
	},
	devtool: 'source-map',
};
