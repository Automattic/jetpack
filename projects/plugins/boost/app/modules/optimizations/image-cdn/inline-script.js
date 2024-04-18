/* eslint-disable @wordpress/no-unused-vars-before-return */

( function () {
	const lazyImages = document.querySelectorAll( 'img[loading=lazy]' );
	lazyImages.forEach( function ( img ) {

		// Require srcset and width/height attributes
		if (
			! img.attributes.width ||
			! img.attributes.height ||
			! img.srcset ||
			! img.srcset.includes( '.wp.com' )
		) {
			return;
		}

		const dpr = window.devicePixelRatio || 1;
		const rect = img.getBoundingClientRect();
		const elWidth = rect.width;
		const ratio = rect.width / rect.height;
		const srcsetEntries = img.srcset.split( ',' );

		let targetIndex = 0;
		let closestWidth = -1;
		let comparisonSrc = img.src;
		let comparisonWidth = elWidth;

		for ( let i = 0; i < srcsetEntries.length; i++ ) {
			const src = srcsetEntries[ i ].trim();
			const [ url, w ] = src.split( ' ' );
			if ( ! w.trim().endsWith( 'w' ) ) {
				continue;
			}

			const width = parseInt( w.trim().slice( 0, -1 ), 10 );
			if ( elWidth > width || ! comparisonWidth || comparisonWidth > width ) {
				comparisonWidth = width;
				comparisonSrc = url;
				targetIndex = i;
				closestWidth = comparisonWidth;
			}
		}

		const url = new URL( comparisonSrc );
		const existingResize = url.searchParams.get( 'resize' );
		if ( ! existingResize ) {
			return;
		}

		// Only resize if the difference is more than 10% (min 50px)
		const diff = elWidth - closestWidth;
		if ( closestWidth > 0 && ( diff < 50 || diff / closestWidth < 0.1 ) ) {
			return;
		}

		// Ceil the width to the nearest 10 to optimize CDN caching
		const width = Math.ceil( elWidth / 10 ) * 10;
		const height = Math.ceil( width / ratio );

		url.searchParams.set( 'resize', `${ width },${ height }` );
		url.searchParams.set( 'jb-lazy', existingResize || '1' );

		const newSrc = url.toString();
		srcsetEntries.splice( targetIndex, 0, `${ newSrc } ${ dpr * window.innerWidth }w` );
		img.srcset = srcsetEntries.join( ',' );
		img.sizes = 'auto';
	} );
} )();
