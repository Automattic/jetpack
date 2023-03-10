const MiniCssExtractLoader = options => ( {
	loader: require( 'mini-css-extract-plugin' ).loader,
	options: options,
} );

const CssLoader = options => ( {
	loader: require.resolve( 'css-loader' ),
	options: {
		// By default we do not want css-loader to try to handle absolute paths.
		url: { filter: path => ! path.startsWith( '/' ) },
		...options,
	},
} );

const CssRule = ( options = {} ) => {
	const exts = options.extensions || [ 'css' ];
	const extraLoaders = options.extraLoaders || [];

	return {
		test: new RegExp(
			'\\.(?:' + exts.map( ext => ext.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) ).join( '|' ) + ')$',
			'i'
		),
		use: [
			MiniCssExtractLoader( options.MiniCssExtractLoader ),
			CssLoader( {
				importLoaders: extraLoaders.length,
				...options.CssLoader,
			} ),
			...extraLoaders,
		],
	};
};
CssRule.MiniCssExtractLoader = MiniCssExtractLoader;
CssRule.CssLoader = CssLoader;

module.exports = CssRule;
