const npath = require( 'path' );

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
					path.addComment( 'leading', ` wp:polyfill ${ npath.basename( name, '.js' ) } ` );
					this.hasAddedPolyfills = true;
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
					path.addComment( 'leading', ` wp:polyfill ${ npath.basename( arg.value, '.js' ) } ` );
					this.hasAddedPolyfills = true;
				}
			},
		},
	};
};
