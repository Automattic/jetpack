( function( $ ) {
	const deactivateLinkElem = $(
		'tr[data-slug=jetpack] > td.plugin-title > div > span.deactivate > a'
	);

	// const deactivateURL = deactivateLinkElem.attr( 'href' );

	deactivateLinkElem.attr( 'href', 'admin.php?page=jetpack#/valueTB_iframe=true' );
	deactivateLinkElem.addClass( 'thickbox' );

	// deactivateLinkElem.on( 'click', function( event ) {
	// 	event.preventDefault();
	// } );
} )( jQuery );
