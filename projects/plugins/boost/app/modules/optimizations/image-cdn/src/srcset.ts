type Dimensions = {
	width: number;
	height: number;
};

type ImageMeta = {
	url: URL;
	width: number;
	height: number;
};

function getDpr() {
	return window.devicePixelRatio || 1;
}

export function parseImageSize( resizeParam: string ): Dimensions | null {
	const [ width, height ] = resizeParam.split( ',' ).map( Number );
	if ( isNaN( width ) || isNaN( height ) ) {
		return null;
	}
	return { width, height };
}

export function getImageSizeFromUrl( url: string ): Dimensions | null {
	const resizeParam = new URL( url ).searchParams.get( 'resize' );
	if ( ! resizeParam ) {
		return null;
	}
	return parseImageSize( resizeParam );
}

export function calculateTargetSize( dimensions: Dimensions ): Dimensions {
	const dpr = getDpr();
	const ratio = dimensions.width / dimensions.height;
	const targetWidth = Math.ceil( ( dimensions.width * dpr ) / 10 ) * 10;
	const targetHeight = Math.ceil( targetWidth / ratio );
	return {
		width: targetWidth,
		height: targetHeight,
	};
}

export function isSizeReusable( desiredWidth: number, existingWidth: number ) {
	if ( existingWidth <= 0 ) {
		return false;
	}
	const diff = existingWidth - desiredWidth;
	if ( diff < 0 ) {
		return false;
	}
	if ( diff < 50 ) {
		return true;
	}
	const ratio = desiredWidth / existingWidth;
	return ratio > 0.9 && ratio <= 1;
}

export function findClosestImageSize( urls: string[], targetWidth: number ): ImageMeta | undefined {
	for ( const src of urls ) {
		const [ url, widthStr ] = src.trim().split( ' ' );
		if ( ! widthStr?.trim().endsWith( 'w' ) ) {
			continue;
		}

		const imageSize = getImageSizeFromUrl( url );
		if ( ! imageSize ) {
			continue;
		}

		if ( isSizeReusable( targetWidth, imageSize.width ) ) {
			return { url: new URL( url ), ...imageSize };
		}
	}

	return undefined;
}

function resizeImage( imageUrl: string, targetSize: Dimensions ): URL {
	const newUrl = new URL( imageUrl );
	newUrl.searchParams.set( 'resize', `${ targetSize.width },${ targetSize.height }` );
	return newUrl;
}

export function dynamicSrcset( img: HTMLImageElement ) {
	if (
		! img.getAttribute( 'width' ) ||
		! img.getAttribute( 'height' ) ||
		! img.srcset ||
		! img.src ||
		! img.src.includes( '.wp.com' )
	) {
		return;
	}

	const rect = img.getBoundingClientRect();
	const targetSize = calculateTargetSize( rect );

	const srcset = img.srcset.split( ',' );
	const closestImage = findClosestImageSize( [ `${ img.src } 0w`, ...srcset ], targetSize.width );

	if ( closestImage ) {
		closestImage.url.searchParams.set( '_jb', 'closest' );
		srcset.push( `${ closestImage.url } ${ window.innerWidth * getDpr() }w` );
		img.srcset = srcset.join( ',' );
		img.sizes = 'auto';
	} else {
		const newUrl = resizeImage( img.src, targetSize );
		newUrl.searchParams.set( '_jb', 'custom' );
		srcset.push( `${ newUrl } ${ window.innerWidth * getDpr() }w` );
		img.srcset = srcset.join( ',' );
		img.sizes = 'auto';
	}
}
