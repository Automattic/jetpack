export function noop() {}

export function texturize( text ) {
	if ( ! text ) {
		return;
	}
	// Ensure we get a string.
	text = text + '';
	text = text
		.replace( /'/g, '&#8217;' )
		.replace( /&#039;/g, '&#8217;' )
		.replace( /[\u2019]/g, '&#8217;' );
	text = text
		.replace( /"/g, '&#8221;' )
		.replace( /&#034;/g, '&#8221;' )
		.replace( /&quot;/g, '&#8221;' )
		.replace( /[\u201D]/g, '&#8221;' );
	// Untexturize allowed HTML tags params double-quotes.
	text = text.replace( /([\w]+)=&#[\d]+;(.+?)&#[\d]+;/g, '$1="$2"' );

	return text.trim();
}

export function applyReplacements( text, replacements ) {
	if ( typeof text !== 'string' ) {
		return;
	}
	if ( ! replacements ) {
		return text;
	}
	return text.replace( /{(\d+)}/g, function ( match, number ) {
		return typeof replacements[ number ] !== 'undefined' ? replacements[ number ] : match;
	} );
}

export function getBackgroundImage( imgEl ) {
	const canvas = document.createElement( 'canvas' );
	const context = canvas.getContext && canvas.getContext( '2d' );

	if ( ! imgEl ) {
		return;
	}

	context.filter = 'blur(20px) ';
	context.drawImage( imgEl, 0, 0 );

	const url = canvas.toDataURL( 'image/png' );
	canvas = null;

	return url;
}

export function calculatePadding( screenPadding ) {
	const baseScreenPadding = 110;
	screenPadding = baseScreenPadding;

	if ( window.innerWidth <= 760 ) {
		screenPadding = Math.round( ( window.innerWidth / 760 ) * baseScreenPadding );
		const isTouch =
			'ontouchstart' in window || ( window.DocumentTouch && document instanceof DocumentTouch );

		if ( screenPadding < 40 && isTouch ) {
			screenPadding = 0;
		}
	}

	return screenPadding;
}
