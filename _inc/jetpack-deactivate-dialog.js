( function( $ ) {
	const deactivateLinkElem = $(
		'tr[data-slug=jetpack] > td.plugin-title > div > span.deactivate > a'
	);

	const deactivateURL = deactivateLinkElem.attr( 'href' );

	deactivateLinkElem.attr( 'href', '#TB_inline?inlineId=jp-disconnect-modal' );
	deactivateLinkElem.addClass( 'thickbox' );

	// deactivateLinkElem.on( 'click', function( event ) {
	// 	event.preventDefault();
	// } );

	// add modal to bottom of body
	$( '#wpbody-content' ).append( `
		<div id="jp-disconnect-modal" style="display: none" >
			<h1>Are you sure you want to deactivate and Disconnect Jetpack?</h1>
			<h2>Here is what you will be missing:</h2>
			<ul>
				<li>Photon powered images & grid-style galleries</li>
				<li>Site Backups!</li>
				<li>Jetpack-Powered Forms!</li>
			</ul>
			<a href="${ deactivateURL }" >Disconnect Anyway</a>

		</div>
	` );
} )( jQuery );
