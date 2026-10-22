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

// CSS is minified in webpack's optimize step; expanded output keeps comments like `/* autoprefixer: off */` for PostCSS.
const SassLoader = ( { sassOptions, ...options } = {} ) => ( {
	loader: require.resolve( 'sass-loader' ),
	options: {
		api: 'modern-compiler',
		sassOptions: { style: 'expanded', ...sassOptions },
		...options,
	},
} );

const PostcssLoader = ( { postcssOptions = {}, ...options } = {} ) => ( {
	loader: require.resolve( 'postcss-loader' ),
	options: {
		...options,
		// An explicit `config` or `plugins` replaces the standard plugins rather than adding to them.
		postcssOptions:
			postcssOptions.config || postcssOptions.plugins
				? postcssOptions
				: { plugins: require( '../postcss-plugins' )(), ...postcssOptions },
	},
} );

const CssRule = ( options = {} ) => {
	const exts = options.extensions || [ 'css', 'sass', 'scss' ];
	const hasLoader = name => ( options.extraLoaders || [] ).some( l => l.loader?.includes( name ) );
	const withDefault = ( Loader, opt, name ) =>
		opt === false || hasLoader( name ) ? [] : [ Loader( opt === true ? {} : opt ) ];
	const extraLoaders = [
		...withDefault( PostcssLoader, options.postcss, 'postcss-loader' ),
		...withDefault( SassLoader, options.sass, 'sass-loader' ),
		...( options.extraLoaders || [] ),
	];

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
CssRule.SassLoader = SassLoader;
CssRule.PostcssLoader = PostcssLoader;

module.exports = CssRule;
