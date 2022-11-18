type Image = {
	type: 'img' | 'srcset' | 'background';
	url: string;
	node: HTMLElement;
	fileSize: {
		width: number;
		height: number;
		weight: number;
	};
};
export async function load( domElements: Element[] ): Promise< Image[] > {
	const parsedNodes = domElements.map( async ( el: Element ): Promise< Image | false > => {
		// Handle <img> tags first.
		if ( el.tagName === 'IMG' && el instanceof HTMLImageElement ) {
			return getImg( el );
		}

		if ( el instanceof HTMLElement ) {
			// Check for background images
			// in all other elements.
			return getBackgroundImage( el );
		}

		return false;
	}, [] );

	return ( await Promise.all( parsedNodes ) ).filter( ( el ): el is Image => false !== el );
}

async function getImageSize( url ) {
	const response = await fetch( url, { method: 'HEAD', mode: 'no-cors' } );
	if ( ! response.url ) {
		// eslint-disable-next-line no-console
		console.log( `Can't get image size for ${ url } likely due to a CORS error.` );
		return -1;
	}

	const size = response.headers.get( 'content-length' );
	if ( size ) {
		return parseInt( size, 10 ) / 1024;
	}

	return -1;
}

async function getImageDimensions( url ) {
	const img = new Image();
	img.src = url;
	return new Promise< { width: number; height: number } >( resolve => {
		img.onload = () => {
			resolve( { width: Math.round( img.width ), height: Math.round( img.height ) } );
		};
	} );
}

async function measurementsFromURL( url: string ) {
	const [ weight, { width, height } ] = await Promise.all( [
		getImageSize( url ),
		getImageDimensions( url ),
	] );

	return {
		width,
		height,
		weight,
	};
}

async function getBackgroundImage( el: HTMLElement ): Promise< Image | false > {
	const style = getComputedStyle( el );
	const url = backgroundImageSrc( style.backgroundImage );

	if ( ! url ) {
		return false;
	}

	const { width, height, weight } = await measurementsFromURL( url );

	return {
		type: 'background',
		url,
		fileSize: {
			width,
			height,
			weight,
		},
		node: el,
	};
}

function backgroundImageSrc( value: string ): string | false {
	const url = value.match( /url\(.?(.*?).?\)/i );
	if ( url && url[ 1 ] && imageLikeURL( url[ 1 ] ) ) {
		return url[ 1 ];
	}

	return false;
}

/**
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

async function getImg( el: HTMLImageElement ): Promise< Image | false > {
	// Get the currently used image source in srcset if it's available.
	const url = el.currentSrc && imageLikeURL( el.currentSrc ) ? el.currentSrc : el.src;
	const type = el.srcset ? 'srcset' : 'img';

	if ( ! url || ! imageLikeURL( url ) ) {
		return false;
	}

	const { width, height, weight } = await measurementsFromURL( url );

	return {
		type,
		url,
		fileSize: {
			width,
			height,
			weight,
		},
		node: el,
	};
}
