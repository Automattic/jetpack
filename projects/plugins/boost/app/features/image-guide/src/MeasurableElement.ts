/* eslint-disable no-useless-constructor */

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
 * @param  value string to check
 */
function imageLikeURL( value: string ): boolean {
	// Look for relative URLs that are not SVGs
	// Intentionally not using an allow-list because images may
	// be served from weird URLs like /images/1234?size=large
	if ( value.startsWith( '/' ) ) {
		return value.endsWith( '.svg' );
	}

	try {
		const url = new URL( value );
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch ( e ) {
		return false;
	}
}

/**
 * DOMElementWithImage - classes implementing this interface represent
 * elements that can be measured in both DOM Dimensions and image weight.
 */
export interface DOMElementWithImage {
	readonly type: 'img' | 'background';
	readonly node: HTMLElement | HTMLImageElement;
	getURL(): string | null;
}

export class ImageTag implements DOMElementWithImage {
	readonly type = 'img';
	constructor( readonly node: HTMLImageElement ) {}
	getURL() {
		if ( imageLikeURL( this.node.currentSrc ) ) {
			return this.node.currentSrc;
		}
		if ( imageLikeURL( this.node.src ) ) {
			return this.node.src;
		}

		return null;
	}
}

export class BackgroundImage implements DOMElementWithImage {
	readonly type = 'background';
	constructor( readonly node: HTMLElement ) {}
	getURL() {
		const src = getComputedStyle( this.node ).backgroundImage;
		const url = src.match( /url\(.?(.*?).?\)/i );
		if ( url && url[ 1 ] && imageLikeURL( url[ 1 ] ) ) {
			return url[ 1 ];
		}

		return null;
	}
}
