/**
 * Build a URL for an AI Hub image shipped under the plugin's `images/ai-hub/` directory.
 *
 * The images are referenced rather than imported because wp-build's esbuild pipeline has no
 * loader for `.webp` or `.svg`, and `_inc/client/**` is `production-exclude` so the sources
 * never reach a built plugin.
 *
 * @param {string} filename - File name within `images/ai-hub/`.
 * @return {string} Absolute URL, or an empty string when no plugin URL is available.
 */
export default function assetUrl( filename ) {
	const { pluginUrl, assetsVersion } = window?.jetpackAiSettings ?? {};

	// Rendering nothing beats a guaranteed 404 against the wrong origin.
	if ( ! pluginUrl ) {
		return '';
	}

	const url = `${ pluginUrl.replace( /\/$/, '' ) }/images/ai-hub/${ filename }`;

	return assetsVersion ? `${ url }?ver=${ encodeURIComponent( assetsVersion ) }` : url;
}
