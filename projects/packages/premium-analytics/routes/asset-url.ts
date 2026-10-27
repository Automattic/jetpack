/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * The URL of an image `bin/copy-images.mjs` copied into `build/images/`.
 *
 * @param relativePath - Path to the image, relative to `routes/`.
 * @return The URL, or `undefined` where the script data carries no base (e.g. Storybook).
 */
export function assetUrl( relativePath: string ): string | undefined {
	const base = getScriptData()?.premium_analytics?.assets_url;

	return base ? `${ base }${ relativePath }` : undefined;
}
