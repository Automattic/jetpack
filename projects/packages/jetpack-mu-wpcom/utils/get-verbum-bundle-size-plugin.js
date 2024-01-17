const zlib = require( 'node:zlib' );
const util = require( 'util' );
const webpack = require( 'webpack' );

class GetVerbumBundleSizePlugin {
	apply( compiler ) {
		compiler.hooks.compilation.tap( 'AfterBuildPlugin', compilation => {
			compilation.hooks.processAssets.tapPromise(
				{
					name: 'AfterBuildPlugin',
					stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
				},
				async () => {
					try {
						const { RawSource } = webpack.sources;
						const verbumCommentsJsAsset = compilation.getAsset(
							'verbum-comments/verbum-comments.js'
						);
						const verbumBundleSizeRegex = /verbumBundleSize/gi;
						let verbumCommentsJsAssetSource = verbumCommentsJsAsset.source.source();
						const compressedSource = await util.promisify( zlib.gzip )(
							verbumCommentsJsAssetSource
						);
						verbumCommentsJsAssetSource = verbumCommentsJsAssetSource.replace(
							verbumBundleSizeRegex,
							compressedSource.length
						);
						compilation.updateAsset(
							'verbum-comments/verbum-comments.js',
							new RawSource( verbumCommentsJsAssetSource )
						);
					} catch ( e ) {}
				}
			);
		} );
	}
}

module.exports = GetVerbumBundleSizePlugin;
