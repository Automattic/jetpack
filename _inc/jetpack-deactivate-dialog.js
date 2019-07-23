// /* global tb_position */

( function( $ ) {
	const deactivateLinkElem = $(
		'tr[data-slug=jetpack] > td.plugin-title > div > span.deactivate > a'
	);

	// const deactivateURL = deactivateLinkElem.attr( 'href' );
	const observer = new MutationObserver( function( mutations ) {
		mutations.forEach( function( mutation ) {
			if ( mutation.type === 'childList' ) {
				mutation.addedNodes.forEach( function( addedNode ) {
					if ( 'TB_window' === addedNode.id ) {
						// NodeList is static, we need to modify this in the DOM
						$( '#TB_window' ).addClass( 'jetpack-disconnect-modal' );
						observer.disconnect();
					}
				} );
			}
		} );
	} );

	const body = $( 'body' )[ 0 ];

	deactivateLinkElem.attr( 'href', 'admin.php?page=jetpack#/valueTB_iframe=true' );
	deactivateLinkElem.addClass( 'thickbox' );
	deactivateLinkElem.on( 'click', function() {
		observer.observe( body, { childList: true } );
	} );
} )( jQuery );
