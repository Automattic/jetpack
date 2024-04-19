type Dimensions = {
	width: number;
	height: number;
};

type ImageMeta = {
	url: string;
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

export function calculateTargetSize( rect: DOMRect ): Dimensions {
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
	return Math.abs( targetWidth - width ) < 50 || Math.abs( targetWidth / width - 1 ) < 0.1;
}

export function findClosestImageSize( urls: string[], targetWidth: number ): ImageMeta | undefined {
	let closestImage: ImageMeta | undefined;
	for ( const src of urls ) {
		const [ url, widthStr ] = src.trim().split( ' ' );
		if ( ! widthStr?.trim().endsWith( 'w' ) ) {
			continue;
		}

		const imageSize = getImageSizeFromUrl( url );
		if ( ! imageSize ) {
			continue;
		}

		const { width, height } = imageSize;
		if ( isNearlySameSize( targetWidth, width ) ) {
			return { url, width, height };
		} else if ( targetWidth > width || ( closestImage?.width && width < closestImage.width ) ) {
			closestImage = { url, width, height };
		}
	}

	return closestImage;
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
		! img.src.includes( '.wp.com' )
	) {
		return;
	}

	const rect = img.getBoundingClientRect();
	const targetSize = calculateTargetSize( rect );

	const srcset = img.srcset.split( ',' );
	const urls = [ `${ img.src } 0w`, ...srcset ];

	const closestImage = findClosestImageSize( urls, targetSize.width );
	if ( closestImage && isNearlySameSize( targetSize.width, closestImage.width ) ) {
		srcset.push( `${ closestImage.url } ${ window.innerWidth * getDpr() }w` );
		img.srcset = srcset.join( ',' );
		img.sizes = 'auto';
	} else {
		const newUrl = resizeImage( img.src, targetSize );
		srcset.push( `${ newUrl } ${ window.innerWidth * getDpr() }w` );
		img.srcset = srcset.join( ',' );
		img.sizes = 'auto';
	}
}
