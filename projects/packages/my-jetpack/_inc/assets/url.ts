import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Build a runtime URL for a raster image copied into `build/images/`.
 *
 * wp-build's esbuild pipeline has no image loader, so WebP and PNG assets are
 * copied at build time and addressed by URL rather than imported.
 *
 * @param relativePath - Path to the image, relative to `_inc/`.
 * @return Absolute URL, or `undefined` when no base is available.
 */
export function assetUrl( relativePath: string ): string | undefined {
	// `myJetpackInitialState` is localized on the My Jetpack page only, so components
	// this package exports to other plugins fall back to the script data, which is
	// printed on every admin page. Rendering nothing beats a guaranteed 404.
	const base = window.myJetpackInitialState?.assetsUrl ?? getScriptData()?.myJetpack?.assetsUrl;

	if ( ! base ) {
		return undefined;
	}

	return `${ base.replace( /\/$/, '' ) }/${ relativePath }`;
}
