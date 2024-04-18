interface ImageSize {
	width: number;
	height: number;
}

function getDpr() {
	return window.devicePixelRatio || 1;
}

export function parseImageSize( resizeParam: string ): ImageSize | null {
	const [ width, height ] = resizeParam.split( ',' ).map( Number );
	if ( isNaN( width ) || isNaN( height ) ) {
		return null;
	}
	return { width, height };
}

export function getImageSizeFromUrl( url: string ): ImageSize | null {
	const resizeParam = new URL( url ).searchParams.get( 'resize' );
	if ( ! resizeParam ) {
		return null;
	}
	return parseImageSize( resizeParam );
}

export function calculateTargetSize( rect: DOMRect ): ImageSize {
	const dpr = getDpr();
	const targetWidth = rect.width * dpr;
	const ratio = rect.width / rect.height;
	const targetHeight = Math.ceil( targetWidth / ratio );
	return {
		width: Math.ceil( targetWidth / 10 ) * 10,
		height: targetHeight,
	};
}

function isNearlySameSize( targetWidth: number, width: number ) {
	return Math.abs( targetWidth - width ) < 50 || targetWidth / width < 0.1;
}

export function findClosestImageSize(
	urls: string[],
	targetWidth: number
): { url: string; width: number } | null {
	let closestWidth = 0;
	let targetUrl = '';
	for ( const src of urls ) {
		const [ url, widthStr ] = src.trim().split( ' ' );
		if ( ! widthStr?.trim().endsWith( 'w' ) ) {
			continue;
		}

		const imageSize = getImageSizeFromUrl( url );
		if ( ! imageSize ) {
			continue;
		}

		const { width } = imageSize;
		if ( targetWidth > width || ( closestWidth && width < closestWidth ) ) {
			closestWidth = width;
			targetUrl = url;
		}

		if ( isNearlySameSize( targetWidth, width ) ) {
			return { url, width };
		}
	}

	if ( targetUrl ) {
		const imageSize = getImageSizeFromUrl( targetUrl );
		if ( imageSize ) {
			return { url: targetUrl, width: imageSize.width };
		}
	}

	return null;
}

function decideImageSize(
	imageUrl: string,
	srcSet: string[],
	targetSize: ImageSize
): { newUrl: string; newSrc: string; targetIndex: number } {
	const dpr = getDpr();
	const newUrl = new URL( imageUrl );
	newUrl.searchParams.set( 'resize', `${ targetSize.width },${ targetSize.height }` );
	newUrl.searchParams.set( 'jb-lazy', `${ targetSize.width },${ targetSize.height }` );

	const targetIndex = srcSet.findIndex( src => src.includes( imageUrl ) );
	const newSrc = `${ newUrl.toString() } ${ dpr * window.innerWidth }w`;

	return { newUrl: newUrl.toString(), newSrc, targetIndex };
}

function updateImageAttributes( img: HTMLImageElement, url: string, size: ImageSize ) {
	const srcset = img.srcset.split( ',' );
	const { newSrc, targetIndex } = decideImageSize( url, srcset, size );

	if ( targetIndex !== -1 ) {
		srcset[ targetIndex ] = newSrc;
	} else {
		srcset.unshift( newSrc );
	}

	img.srcset = srcset.join( ',' );
	img.sizes = 'auto';
}

export function dynamicSrcset( img: HTMLImageElement ) {
	if (
		! img.getAttribute( 'width' ) ||
		! img.getAttribute( 'height' ) ||
		! img.srcset ||
		! img.src.includes( '.wp.com' ) ||
		! img.src.includes( 'resize=' )
	) {
		return;
	}

	const rect = img.getBoundingClientRect();
	const targetSize = calculateTargetSize( rect );

	const urls = img.srcset.split( ',' );
	urls.unshift( `${ img.src } 0w` );

	const closestImage = findClosestImageSize( urls, targetSize.width );
	if ( closestImage ) {
		updateImageAttributes( img, closestImage.url, targetSize );
	}
}
