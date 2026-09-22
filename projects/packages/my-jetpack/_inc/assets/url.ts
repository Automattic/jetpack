import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Build a runtime URL for a raster image copied into `build/images/` by
 * `bin/copy-raster-images.mjs`.
 *
 * Another plugin's bundle can request these paths from this copy, so never rename an image.
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
