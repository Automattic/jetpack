const { filterItems } = require( '@babel/helper-compilation-targets' );
const browserslist = require( 'browserslist' );
const TerserPlugin = require( 'terser-webpack-plugin' );

// We want @wordpress/browserslist-config rather than browserslist's own defaults.
const browsers = browserslist(
	( browserslist.findConfig( '.' ) || {} ).defaults || require( '@wordpress/browserslist-config' )
);

/**
 * Terser's function to decide which comments to preserve.
 *
 * @see https://github.com/terser/terser/blob/v5.9.0/lib/output.js#L171-L177
 * @param {object} comment - Comment object.
 * @param {string} comment.type - Comment type.
 * @param {string} comment.value - Comment text.
 * @returns {boolean} Whether to keep it.
 */
function isSomeComments( comment ) {
	return (
		( comment.type === 'comment2' || comment.type === 'comment1' ) &&
		/@preserve|@lic|@cc_on|^\**!/i.test( comment.value )
	);
}

/**
 * Function to match a WP i18n "translators" comment.
 *
 * @see https://github.com/php-gettext/Gettext/blob/4.x/src/Utils/ParsedComment.php#L53-L73
 * @see https://github.com/wp-cli/i18n-command/blob/v2.2.9/src/JsCodeExtractor.php#L15
 * @param {object} comment - Comment object.
 * @param {string} comment.type - Comment type.
 * @param {string} comment.value - Comment text.
 * @returns {boolean} Whether to keep it.
 */
function isTranslatorsComment( comment ) {
	return (
		( comment.type === 'comment2' || comment.type === 'comment1' ) &&
		/^[#*/ \t\r\n]*[tT]ranslators/.test( comment.value )
	);
}

const defaultOptions = {
	terserOptions: {
		ecma: null,
		safari10: browsers.some( b => b.match( /^(safari|ios_saf) 1[01]/ ) ),
		ie8: browsers.some( b => b === 'ie 8' ),
		mangle: {
			// Preserve WP i18n methods.
			reserved: [ '__', '_n', '_nx', '_x' ],
		},
		format: {
			// The `new Function` bit here is a hack to work around the way terser-webpack-plugin serializes
			// the terserOptions. The "comments" function must not refer to anything from the local or global scope,
			// so we "paste" our external functions inside.
			comments: new Function(
				'node',
				'comment',
				`${ isTranslatorsComment }; return isTranslatorsComment( comment )`
			),
		},
	},
	// Same.
	extractComments: new Function(
		'node',
		'comment',
		`${ isSomeComments }; return isSomeComments( comment )`
	),
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
	browsers
);
if (
	babelPlugins.has( 'transform-arrow-functions' ) ||
	babelPlugins.has( 'transform-shorthand-properties' ) ||
	babelPlugins.has( 'transform-unicode-escapes' )
) {
	defaultOptions.terserOptions.ecma = 5;
} else if ( babelPlugins.has( 'proposal-nullish-coalescing-operator' ) ) {
	defaultOptions.terserOptions.ecma = 2019;
} else {
	defaultOptions.terserOptions.ecma = 2020;
}

/**
 * Merge two objects, recursively.
 *
 * @param {*} a - Object A.
 * @param {*} b - Object B.
 * @returns {*} Result:
 * - If A and B are both plain objects, like { ...a, ...b }.
 * - If they're arrays, elements of B replace those of A.
 * - If B is undefined, A. Else B.
 */
function mergeObj( a, b ) {
	if (
		a instanceof Object &&
		b instanceof Object &&
		( ( Array.isArray( a ) && Array.isArray( b ) ) ||
			( Object.getPrototypeOf( a ) === Object.prototype &&
				Object.getPrototypeOf( b ) === Object.prototype ) )
	) {
		const ret = Array.isArray( a ) ? [ ...a ] : { ...a };
		for ( const k of Object.keys( b ) ) {
			ret[ k ] = mergeObj( ret[ k ], b[ k ] );
		}
		return ret;
	}

	if ( typeof b === 'undefined' ) {
		return a;
	}

	return b;
}

module.exports = ( options = {} ) => new TerserPlugin( mergeObj( defaultOptions, options ) );
module.exports.defaultOptions = defaultOptions;
module.exports.isSomeComments = isSomeComments;
module.exports.isTranslatorsComment = isTranslatorsComment;
