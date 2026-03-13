const { buildParserFile } = require( '@lezer/generator' );

/**
 * Webpack loader for processing Lezer parser grammars.
 *
 * This loader processes `.grammar` files and generates the appropriate module code.
 * It supports multiple ways to request parser vs terms:
 * - `xyz.grammar` (default) for the generated parser
 * - `xyz.grammar?terms` for the parser terms
 *
 * Usage in webpack config:
 * ```
 * module.exports = {
 *   module: {
 *     rules: [
 *       {
 *         test: /\.grammar$/,
 *         use: 'lezer-loader.js',
 *       }
 *     ]
 *   }
 * };
 * ```
 *
 * Usage in code:
 * ```
 * import parser from './xyz.grammar';
 * import * as terms from './xyz.grammar?terms';
 * ```
 *
 * @see [https://lezer.codemirror.net](https://lezer.codemirror.net)
 * @see [https://github.com/lezer-parser/generator/blob/dbf0e3d579cf383a4dea2c1ed50ba3fd5407cf81/src/rollup-plugin-lezer.js](https://github.com/lezer-parser/generator/blob/dbf0e3d579cf383a4dea2c1ed50ba3fd5407cf81/src/rollup-plugin-lezer.js)
 *
 * @type {import('webpack').LoaderDefinitionFunction}
 */
module.exports = function lezerLoader( source ) {
	const callback = this.async();
	this.addDependency( this.resourcePath );
	const isTermsImport = new URLSearchParams( this.resourceQuery ).has( 'terms' );

	try {
		const { parser, terms } = buildParserFile( source, {
			fileName: this.resourcePath,
			moduleStyle: 'es',
		} );
		callback( null, isTermsImport ? terms : parser );
	} catch ( error ) {
		callback( error );
	}
};
