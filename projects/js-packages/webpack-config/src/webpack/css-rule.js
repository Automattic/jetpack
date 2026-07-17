const isDevelopment = process.env.NODE_ENV !== 'production';

const MiniCssExtractLoader = options => ( {
	loader: require( 'mini-css-extract-plugin' ).loader,
	options: options,
} );

const CssLoader = options => ( {
	loader: require.resolve( 'css-loader' ),
	options: {
		// By default we do not want css-loader to try to handle absolute paths.
		url: { filter: path => ! path.startsWith( '/' ) },
		modules: {
			auto: true,
			localIdentName: isDevelopment ? '[local]--[hash:base64:5]' : '[hash:base64]',
		},
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
		// CSS imports are always side effects (they inject styles into the DOM),
		// so override any package.json "sideEffects: false" declarations.
		sideEffects: true,
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
