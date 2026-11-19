const { filterItems, default: getTargets } = require( '@babel/helper-compilation-targets' );
const MinimizerPlugin = require( 'minimizer-webpack-plugin' );
// We want @wordpress/browserslist-config rather than browserslist's own defaults.
const browsers = require( '../targets.js' );

const terserDefaultOptions = {
	implementation: MinimizerPlugin.terserMinify,
	options: {
		ecma: null,
		safari10: browsers.some( b => b.match( /^(safari|ios_saf) 1[01]/ ) ),
		ie8: browsers.some( b => b === 'ie 8' ),
		mangle: {
			// Preserve WP i18n methods.
			reserved: [ '__', '_n', '_nx', '_x' ],
		},
		format: {
			// @see https://github.com/php-gettext/Gettext/blob/4.x/src/Utils/ParsedComment.php#L53-L73
			// @see https://github.com/wp-cli/i18n-command/blob/v2.2.9/src/JsCodeExtractor.php#L15
			comments: /^[#*/ \t\r\n]*[tT]ranslators/,
		},
	},
};

// Terser has an "ecma" option, but really only cares about a few
// features. So determine the ecma version based on whether babel would
// transpile those features.
//
// When updating terser, check whether they added any new tests based on "ecma".
const babelPlugins = filterItems(
	require( '@babel/compat-data/plugins' ),
	new Set(),
	new Set(),
	getTargets( { browsers } )
);
if (
	babelPlugins.has( 'transform-arrow-functions' ) ||
	babelPlugins.has( 'transform-shorthand-properties' ) ||
	babelPlugins.has( 'transform-unicode-escapes' )
) {
	terserDefaultOptions.options.ecma = 5;
} else if (
	babelPlugins.has( 'proposal-nullish-coalescing-operator' ) ||
	babelPlugins.has( 'transform-nullish-coalescing-operator' )
) {
	terserDefaultOptions.options.ecma = 2019;
} else {
	terserDefaultOptions.options.ecma = 2020;
}

const cssnanoDefaultOptions = {
	implementation: MinimizerPlugin.cssnanoMinify,
};

const defaultOptions = {
	test: /\.([cm]?js|css)(\?.*)?$/i,
	minify: [ terserDefaultOptions, cssnanoDefaultOptions ],
	extractComments: /@preserve|@lic|@cc_on|^\**!/i,
};

module.exports = ( options = {} ) => new MinimizerPlugin( { ...defaultOptions, ...options } );
module.exports.defaultOptions = defaultOptions;
module.exports.terserDefaultOptions = terserDefaultOptions;
module.exports.cssnanoDefaultOptions = cssnanoDefaultOptions;
module.exports.MinimizerPlugin = MinimizerPlugin;
