type Image = {
	type: 'img' | 'srcset' | 'background';
	url: string;
	width: number;
	height: number;
	node: Element;
	fileSize: number;
};
export async function load( domElements: Element[] ) {
	const parsedNodes = domElements.map( async ( el: Element ) => {
		// Handle <img> tags first.
		if ( el.tagName === 'IMG' ) {
			return getImg( el as HTMLImageElement );
		}

		// Check for background images
		// in all other elements.
		return getBackgroundImage( el );
	}, [] );

	return ( await Promise.all( parsedNodes ) ).filter( Boolean ) as Image[];
}

async function getImageSize( url ) {
	// Try the performance API first.
	const perfEntry = performance.getEntriesByName(
		url,
		'resource'
	)[ 0 ] as PerformanceResourceTiming;
	if ( perfEntry && perfEntry.transferSize ) {
		return perfEntry.transferSize / 1024;
	}

	// If Performance API doesn't yield results,
	// try a hacky way using fetch.
	try {
		const response = await fetch( url, { method: 'HEAD', mode: 'no-cors' } );

		if ( ! response.url ) {
			console.log( `Can't get image size for ${ url } likely due to a CORS error.` );
			return -1;
		}

		const size = response.headers.get( 'content-length' );
		if ( size ) {
			return parseInt( size, 10 ) / 1024;
		}
	} catch ( e ) {
		console.error( e );
	}

	return -1;
}

async function getImageDimensions( url ) {
	const img = new Image();
	img.src = url;
	return new Promise< { width: number; height: number } >( resolve => {
		img.onload = () => {
			resolve( { width: Math.round(img.width), height: Math.round(img.height) } );
		};
	} );
}

async function measurementsFromURL( url: string ) {
	const [ fileSize, { width, height } ] = await Promise.all( [
		getImageSize( url ),
		getImageDimensions( url ),
	] );

	return {
		fileSize,
		width,
		height,
	};
}

async function getBackgroundImage( el: Element ): Promise< Image | false > {
	const style = getComputedStyle( el );
	const url = backgroundImageSrc( style.backgroundImage );

	if ( ! url ) {
		return false;
	}

	const { width, height, fileSize } = await measurementsFromURL( url );

	return {
		type: 'background',
		width,
		height,
		url,
		fileSize,
		node: el,
	};
}

function backgroundImageSrc( backgroundValue: string ): string | false {
	if ( ! isImageURL( backgroundValue ) ) {
		return false;
	}

	const url = backgroundValue.match( /url\(.?(.*?).?\)/i );
	if ( url && url[ 1 ] ) {
		return url[ 1 ];
	}

	return false;
}

function isImageURL( url: string ): boolean {
	const ignore = [ 'data:image', 'gradient', '.svg', 'none', 'initial', 'inherit' ];
	if ( ignore.some( ignore => url.includes( ignore ) ) ) {
		return false;
	}

	return true;
}

async function getImg( el: HTMLImageElement ): Promise< Image | false > {
	// Get the currently used image source in srcset if it's available.
	const url = el.currentSrc || el.src;
	const type = el.srcset ? 'srcset' : 'img';

	if ( ! url || ! isImageURL( url ) ) {
		return false;
	}

	const { width, height, fileSize } = await measurementsFromURL( url );

	return {
		type,
		width,
		height,
		url,
		fileSize,
		node: el,
	};
}
