/* global calypsoifyGutenberg */
jQuery( function( $ ) {
	const editPostHeaderInception = setInterval( function() {
		const $editPostHeader = $( '.edit-post-header' );
		if ( $editPostHeader.length < 1 ) {
			return;
		}
		clearInterval( editPostHeaderInception );

		$( '<button/>', {
			'class': 'editor-ground-control__back',
			html: calypsoifyGutenberg.closeLabel
		} )
		.bind( 'click', function() {
			window.location.href = calypsoifyGutenberg.closeUrl;
		} )
		.prependTo( $editPostHeader );
	} );

	$( 'body.revision-php a' ).each( function() {
		const href = $( this ).attr( 'href' );
		$( this ).attr( 'href', href.replace( '&classic-editor', '' ) );
	}, 300 );
} );
