/**
 * External dependencies
 */
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';

/**
 * Resolve a safe poster URL, resized by Photon since wpcom sends posters full-size.
 *
 * @param poster - The row's raw poster URL.
 * @param width  - Requested width in pixels.
 * @param height - Requested height in pixels.
 * @return The resized URL, or undefined when there is no safe poster.
 */
export function getVideoPosterUrl( poster: unknown, width: number, height: number ) {
	const url = safeHttpUrl( poster );

	if ( ! url ) {
		return undefined;
	}

	const resized = new URL( url );
	resized.searchParams.set( 'resize', `${ width },${ height }` );

	return resized.toString();
}
