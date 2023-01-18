import { MeasurableImage } from './MeasurableImage';

/**
 * Get elements that either are image tags or have a background image.
 *
 * @param {Element[]} nodes -  A list of nodes to filter
 * @returns {HTMLElement[] | HTMLImageElement[]} - A list of nodes that are either image tags or have a background image.
 */
export function findMeasurableElements( nodes: Element[] ): HTMLElement[] | HTMLImageElement[] {
	return nodes.filter( ( el ): el is HTMLElement | HTMLImageElement => {
		if ( el instanceof HTMLImageElement ) {
			return true;
		}
		if ( el instanceof HTMLElement ) {
			const style = getComputedStyle( el );
			return 'none' !== style.backgroundImage;
		}
		return false;
	} );
}

/**
 * Get the current image source from a node.
 *
 * @param {HTMLImageElement} node -  HTMLImageElement
 * @returns {string | null} - The URL of the image or null if it can't be determined.
 */
export function imageTagSource( node: HTMLImageElement ) {
	if ( imageLikeURL( node.currentSrc ) ) {
		return node.currentSrc;
	}
	if ( imageLikeURL( node.src ) ) {
		return node.src;
	}

	return null;
}

/**
 * Get the background image URL from a node.
 *
 * @param {HTMLImageElement} node - HTMLElement
 * @returns {string | null} - The URL of the image or null if it can't be determined.
 */
export function backgroundImageSource( node: HTMLElement ) {
	const src = getComputedStyle( node ).backgroundImage;
	const url = src.match( /url\(.?(.*?).?\)/i );
	if ( url && url[ 1 ] && imageLikeURL( url[ 1 ] ) ) {
		return url[ 1 ];
	}
	return null;
}

/**
 * Create MeasurableImage objects from a list of nodes
 * and remove any nodes that can't be measured.
 *
 * @param {Element[]} domNodes - A list of nodes to measure
 * @returns {MeasurableImage[]} - A list of MeasurableImage objects.
 */
export function getMeasurableImages( domNodes: Element[] ): MeasurableImage[] {
	const nodes = findMeasurableElements( domNodes );
	return nodes
		.map( node => {
			if ( node instanceof HTMLImageElement ) {
				return new MeasurableImage( node, imageTagSource );
			} else if ( node instanceof HTMLElement ) {
				if ( ! backgroundImageSource( node ) ) {
					/**
					 * Background elements that have no valid URL
					 * shouldn't be measured.
					 */
					return null;
				}

				return new MeasurableImage( node, backgroundImageSource );
			}

			return null;
		} )
		.filter( image => image !== null );
}

/**
 * isImageLikeURL - a helper function to determine if URL could be an image.
 *
 * This function ensures that the value passed in looks like a URL.
 * This is because `background: url(...)` and `src="..."` can
 * contain various values that are not URLs, like:
 * - none
 * - linear-gradient(...)
 * - data:image/png;base64,...
 * - ...
 *
 * For the purposes of analyzing image sizes,
 * we also don't consider SVGs to be images.
 *
 * @param {string} value - string to check
 * @returns {boolean} - true if the value looks like a URL
 */
function imageLikeURL( value: string ): boolean {
	// Look for relative URLs that are not SVGs
	// Intentionally not using an allow-list because images may
	// be served from weird URLs like /images/1234?size=large
	if ( value.startsWith( '/' ) ) {
		// Remove query string parameters
		const path = value.split( '?' )[ 0 ];
		return ! path.endsWith( '.svg' );
	}

	try {
		const url = new URL( value );
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch ( e ) {
		return false;
	}
}
