( function () {
	const lazyImages = document.querySelectorAll( 'img' );
	lazyImages.forEach( function ( img ) {
		const currentSrc = img.currentSrc;
		const src = img.dataset.src || img.src;

		if ( ! src && ! src.includes( '.wp.com' ) ) {
			return;
		}
		const dpr = window.devicePixelRatio || 1;
		const clientSizes = [ img.clientWidth * dpr, img.clientHeight * dpr ];
		const attrSizes = [
			parseInt( img.attributes.width.value ) * dpr,
			parseInt( img.attributes.height.value ) * dpr,
		];
		let sizes = clientSizes;

		if (
			attrSizes[ 0 ] &&
			attrSizes[ 1 ] &&
			attrSizes[ 0 ] > 0 &&
			attrSizes[ 1 ] > 0 &&
			attrSizes[ 0 ] < clientSizes[ 0 ]
		) {
			sizes = [ attrSizes[ 0 ], attrSizes[ 1 ] ];
		}

		// Adjust width and height based on devicePixelRatio without exceeding original dimensions
		const width = sizes[ 0 ];
		const height = sizes[ 1 ];

		const url = new URL( src );
		const existingSize = url.searchParams.get( 'resize' );
		url.searchParams.set( 'resize', `${ width },${ height }` );
		url.searchParams.set( 'jb-lazy', existingSize || '1' );

		if ( img.srcset?.includes( ` ${ width }w,` ) ) {
			return;
		}

		const newSrc = url.toString();
		if ( img.srcset ) {
			img.srcset = `${ newSrc } ${ dpr * window.innerWidth }w, ${ img.srcset }`;
		} else {
			img.srcset = `${ newSrc } ${ dpr * window.innerWidth }w`;
		}
		img.sizes = 'auto';

		console.log( 'Adding', newSrc, {
			width,
			height,
			attrSizes,
			clientSizes,
			sizes,
			complete: img.complete,
			currentSrc,
		} );
	} );
} )();
