export function dynamicSrcset( img: HTMLImageElement ) {
	// Require srcset and width/height attributes
	if (
		! img.attributes.width ||
		! img.attributes.height ||
		! img.srcset ||
		! img.src.includes( '.wp.com' ) ||
		! img.src.includes( 'resize=' )
	) {
		return;
	}

	const dpr = window.devicePixelRatio || 1;
	const rect = img.getBoundingClientRect();
	const ratio = rect.width / rect.height;
	const urls = img.srcset.split( ',' );

	let targetIndex = 0;
	let closestWidth = 0;
	let targetWidth = rect.width * dpr;
	let targetUrl = img.src;
	// Loop over the srcset
	for ( let i = -1; i < urls.length; i++ ) {
		// Unconventional, I know. Keeping it simple-ish.
		const src = i === -1 ? `${ img.src } 0w` : urls[ i ].trim();
		const [ url, w ] = src.split( ' ' );

		// Only look at media queries that target width
		if ( ! w.trim().endsWith( 'w' ) ) {
			continue;
		}

		// Get the width from the resize param
		const resizeParam = new URL( url ).searchParams.get( 'resize' );
		if ( ! resizeParam ) {
			continue;
		}
		const width = parseInt( resizeParam.split( ',' )[ 0 ], 10 );

		if ( targetWidth > width && closestWidth && width < closestWidth ) {
			closestWidth = width;
			targetIndex = i;
			targetUrl = url;
		}

		// If the difference is less than 10% of the target width, use that width
		// and don't look any further
		const diff = Math.abs( targetWidth - width );
		if ( diff < 50 || diff / closestWidth < 0.1 ) {
			targetWidth = width;
			closestWidth = width;
			targetIndex = i;
			targetUrl = url;
			break;
		}
	}

	const url = new URL( targetUrl );

	// Ceil the width to the nearest 10 to optimize CDN caching
	const width = Math.ceil( targetWidth / 10 ) * 10;
	const height = Math.ceil( width / ratio );

	url.searchParams.set( 'resize', `${ width },${ height }` );
	url.searchParams.set( 'jb-lazy', `${ closestWidth },${ Math.ceil( closestWidth / ratio ) }` );

	const newSrc = url.toString();
	urls.splice( targetIndex, 0, `${ newSrc } ${ dpr * window.innerWidth }w` );

	img.srcset = urls.join( ',' );
	img.sizes = 'auto';
}
