const path = require( 'path' );
const { getCommonConfig, getComponentEntries } = require( './webpack.common.cjs' );

module.exports = {
	...getCommonConfig( false ),
	entry: getComponentEntries(),
	output: {
		path: path.resolve( './', 'dist' ),
		filename: pathData => {
			const name = pathData.chunk.name;
			if ( name === 'index' ) {
				return 'index.cjs';
			}
			return `${ name }/index.cjs`;
		},
		library: {
			type: 'commonjs2',
		},
	},
	devtool: 'source-map',
};
