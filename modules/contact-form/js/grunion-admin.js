/* global ajaxurl */
jQuery( function( $ ) {
	$( document ).on( 'click', '#jetpack-check-feedback-spam:not(.button-disabled)', function( e ) {
		e.preventDefault();

		$( '#jetpack-check-feedback-spam:not(.button-disabled)' ).addClass( 'button-disabled' );
		$( '.jetpack-check-feedback-spam-spinner' )
			.addClass( 'spinner' )
			.show();
		grunion_check_for_spam( 0, 100 );
	} );

	function grunion_check_for_spam( offset, limit ) {
		$.post(
			ajaxurl,
			{
				action: 'grunion_recheck_queue',
				offset: offset,
				limit: limit,
			},
			function( result ) {
				if ( result.processed < limit ) {
					window.location.reload();
				} else {
					grunion_check_for_spam( offset + limit, limit );
				}
			}
		);
	}
} );
