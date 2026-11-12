// Derived from https://www.npmjs.com/package/static-site-generator-webpack-plugin
// Then removed Webpack 4 support and a bunch of features we didn't use.

const evaluate = require( 'eval' );
const webpack = require( 'webpack' );

const RawSource = webpack.sources.RawSource;

// React 19's `react-dom/server` (in a browser-like context like we have here) uses `MessageChannel` in a way that causes Node to hang because the event loop never empties.
// Supply a fake partial MessageChannel implementation (just enough for what React uses) that hacks around this problem.
// If we wind up needing something more complex, https://github.com/react/react/issues/26608#issuecomment-1734172596 may help.
class FakeMessageChannel {
	constructor() {
		this.port1 = { onmessage: null };
		this.port2 = { postMessage: data => setImmediate( () => this.port1.onmessage?.( { data } ) ) };
	}
}

class StaticSiteGeneratorWebpackPlugin {
	constructor( options = {} ) {
		this.entry = options.entry;
		this.globals = options.globals;
	}

	apply( compiler ) {
		compiler.hooks.thisCompilation.tap( 'static-site-generator-webpack-plugin', compilation => {
			compilation.hooks.optimizeAssets.tapPromise(
				'static-site-generator-webpack-plugin',
				async () => {
					const webpackStats = compilation.getStats();
					const webpackStatsJson = webpackStats.toJson();

					try {
						const asset = this.findAsset( compilation, webpackStatsJson );

						if ( asset == null ) {
							throw new Error( `Source file not found: "${ this.entry }"` );
						}

						let render = evaluate(
							asset.source.source(),
							/* filename: */ this.entry,
							/* scope: */ { MessageChannel: FakeMessageChannel, ...this.globals },
							/* includeGlobals: */ true
						);

						if ( Object.hasOwn( render, 'default' ) ) {
							render = render.default;
						}

						if ( typeof render !== 'function' ) {
							throw new Error(
								`Export from "${ this.entry }" must be a function that returns an HTML string. Is output.libraryTarget in the configuration set to "umd"?`
							);
						}

						for ( const [ assetName, rawSource ] of Object.entries( await render() ) ) {
							compilation.emitAsset( assetName, new RawSource( rawSource ) );
						}
					} catch ( err ) {
						compilation.errors.push( err.stack );
					}
				}
			);
		} );
	}

	findAsset( compilation, webpackStatsJson ) {
		let src = this.entry;

		if ( ! src ) {
			const chunkNames = Object.keys( webpackStatsJson.assetsByChunkName );

			src = chunkNames[ 0 ];
		}

		const asset = compilation.getAsset( src );

		if ( asset ) {
			return asset;
		}

		let chunkValue = webpackStatsJson.assetsByChunkName[ src ];

		if ( ! chunkValue ) {
			return null;
		}
		// Webpack outputs an array for each chunk when using sourcemaps
		if ( chunkValue instanceof Array ) {
			// Is the main bundle always the first element?
			chunkValue = chunkValue.find( function ( filename ) {
				return /\.js$/.test( filename );
			} );
		}
		return compilation.getAsset( chunkValue );
	}
}

module.exports = StaticSiteGeneratorWebpackPlugin;
