/**
 * Build a runtime URL for a raster image copied into `build/images/`.
 *
 * wp-build's esbuild pipeline has no image loader, so WebP and PNG assets are
 * copied at build time and addressed by URL rather than imported.
 *
 * @param relativePath - Path to the image, relative to `_inc/`.
 * @return Absolute URL, or the relative path when no base is available.
 */
export function assetUrl( relativePath: string ): string {
	const base = window.myJetpackInitialState?.assetsUrl;

	if ( ! base ) {
		return relativePath;
	}

	return `${ base.replace( /\/$/, '' ) }/${ relativePath }`;
}
