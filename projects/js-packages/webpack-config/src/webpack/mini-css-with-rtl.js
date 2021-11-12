/**
 * Webpack plugin to wrap mini-css-extract-plugin's asset-name returning
 * function with one that conditionally substitutes the rtl asset from
 * `@automattic/webpack-rtl-plugin`.
 *
 * Forked from @automattic/calyspo-build v9.0.0, then significantly cleaned up.
 */
const { validate } = require( 'schema-utils' );
const webpack = require( 'webpack' );
const PLUGIN_NAME = 'MiniCSSWithRTL';

const schema = {
	title: 'MiniCSSWithRTL plugin options',
	type: 'object',
	additionalProperties: false,
	properties: {
		isRtlExpr: {
			type: 'string',
			description: 'JavaScript expression indicating whether RTL CSS should be used.',
			minLength: 1,
		},
	},
};

class MiniCSSWithRTLModule extends webpack.RuntimeModule {
	constructor( { isRtlExpr = "document.dir === 'rtl'" } = {} ) {
		super( 'get mini-css chunk filename with rtl' );
		this.isRtlExpr = isRtlExpr;
	}

	generate() {
		const {
			compilation: { runtimeTemplate },
		} = this;
		const namespace = webpack.RuntimeGlobals.require;
		const template = webpack.Template;

		return template.asString( [
			`if ( ! ${ namespace }.miniCssF ) throw new Error( 'MiniCSSWithRTLPlugin was loaded before MiniCSSExtractPlugin' );`,
			`${ namespace }.miniCssF = (`,
			template.indent(
				runtimeTemplate.returningFunction(
					runtimeTemplate.basicFunction( 'chunkId', [
						`var isRtl = ${ this.isRtlExpr };`,
						'var originalUrl = originalFn( chunkId );',
						"return isRtl ? originalUrl.replace( /\\.css(?:$|\\?)/, '.rtl$&' ) : originalUrl;",
					] ),
					'originalFn'
				)
			),
			`)( ${ namespace }.miniCssF );`,
		] );
	}
}

module.exports = class MiniCSSWithRTLPlugin {
	constructor( options = {} ) {
		validate( schema, options, {
			name: 'MiniCSSWithRTL plugin',
			baseDataPath: 'options',
		} );
		this.options = options;
	}

	apply( compiler ) {
		compiler.hooks.thisCompilation.tap( PLUGIN_NAME, compilation => {
			compilation.hooks.runtimeRequirementInTree
				.for( webpack.RuntimeGlobals.ensureChunkHandlers )
				.tap( PLUGIN_NAME, chunk => {
					compilation.addRuntimeModule( chunk, new MiniCSSWithRTLModule( this.options ) );
				} );
		} );
	}
};
