const npath = require( 'path' );
const wpPolyfillModules = require( './wp-polyfill-modules.json' ).modules;

/**
 * Normalize a polyfill's name.
 *
 * @param {string} name - The polyfill name to normalize.
 *
 * @return {string} The normalized name.
 */
function normalizePolyfillName( name ) {
	return name.replace( /^esnext\./, 'es.' );
}

const normalizedPolyfillModules = wpPolyfillModules.map( normalizePolyfillName );

/**
 * Check whether any of the supported `wp-polyfill` versions include this polyfill.
 *
 * @param {string} name - The polyfill name to check.
 *
 * @return {boolean} Whether any of the supported `wp-polyfill` versions include this polyfill
 */
function isPolyfillSupported( name ) {
	return normalizedPolyfillModules.includes( normalizePolyfillName( name ) );
}

/**
 * Babel plugin that looks for `core-js` imports (or requires)
 * and replaces them with magic comments to mark the file as
 * depending on wp-polyfill.
 *
 * Based on https://github.com/WordPress/gutenberg/blob/28f1b5b308a62098f0e1e253cb734c83b2fa1356/packages/babel-preset-default/replace-polyfills.js
 *
 * @param {object} babel - Babel object.
 * @param {object} opts  - Options from Babel config.
 * @return {object} Babel plugin.
 */
module.exports = ( babel, opts ) => {
	const { types: t } = babel;
	const coreJsPrefix = opts.absoluteImports
		? npath.dirname(
				require.resolve( 'core-js/package.json', { paths: [ opts.absoluteImports ] } )
			) + '/'
		: 'core-js/';

	return {
		name: 'replacePolyfills',
		pre() {
			this.hasAddedPolyfills = false;
		},
		visitor: {
			Program: {
				exit( path ) {
					if ( this.hasAddedPolyfills ) {
						// Add magic comment to top of file.
						path.addComment( 'leading', ' wp:polyfill ' );
					}
				},
			},

			// Handle `import` syntax.
			ImportDeclaration( path ) {
				const source = path.node.source;
				const name = source.value || '';

				// Look for imports from `core-js`.
				if ( name.startsWith( coreJsPrefix ) ) {
					// Replace import.
					path.replaceWith( t.noop() );
					const polyfillName = npath.basename( name, '.js' );
					if ( isPolyfillSupported( polyfillName ) ) {
						path.addComment( 'leading', ` wp:polyfill ${ polyfillName } ` );
						this.hasAddedPolyfills = true;
					}
				}
			},

			// Handle `require` syntax.
			ExpressionStatement( path ) {
				const expression = path.node.expression;
				if ( ! t.isCallExpression( expression ) ) {
					return;
				}

				const callee = expression.callee;
				const arg = expression.arguments[ 0 ];
				if (
					t.isIdentifier( callee ) &&
					callee.name === 'require' &&
					t.isStringLiteral( arg ) &&
					arg.value.startsWith( coreJsPrefix )
				) {
					// Replace require.
					path.replaceWith( t.noop() );
					const polyfillName = npath.basename( arg.value, '.js' );
					if ( isPolyfillSupported( polyfillName ) ) {
						path.addComment( 'leading', ` wp:polyfill ${ polyfillName } ` );
						this.hasAddedPolyfills = true;
					}
				}
			},
		},
	};
};
