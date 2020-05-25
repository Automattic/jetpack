( function( $ ) {
	var deactivateLinkElem = $(
		'tr[data-slug=jetpack] > td.plugin-title > div > span.deactivate > a'
	);

	var deactivateJetpackURL = deactivateLinkElem.attr( 'href' );

	window.deactivateJetpack = function() {
		window.location.href = deactivateJetpackURL;
	};

	var observer = new MutationObserver( function( mutations ) {
		mutations.forEach( function( mutation ) {
			if ( mutation.type === 'childList' ) {
				mutation.addedNodes.forEach( function( addedNode ) {
					if ( 'TB_window' === addedNode.id ) {
						// NodeList is static, we need to modify this in the DOM

						$( '#TB_window' ).addClass( 'jetpack-disconnect-modal' );
						centralizeDeactivationModal();
						observer.disconnect();
					}
				} );
			}
		} );
	} );

	window.centralizeDeactivationModal = function() {
		var modal = $( '#TB_window.jetpack-disconnect-modal' );
		var top = $( window ).height() / 2 - $( modal ).height() / 2;
		$( modal ).css( 'top', top + 'px' );
	};

	var body = $( 'body' )[ 0 ];

	var tracksProps = {
		location: 'plugins',
		purpose: 'deactivate',
	};

	deactivateLinkElem.attr( 'href', 'plugins.php#TB_inline?inlineId=jetpack_deactivation_dialog' );
	deactivateLinkElem.attr( 'title', deactivate_dialog.title );
	deactivateLinkElem.addClass( 'thickbox' );
	deactivateLinkElem.html( deactivate_dialog.deactivate_label );
	deactivateLinkElem.on( 'click', function( e ) {
		observer.observe( body, { childList: true } );
		analytics.tracks.recordEvent( 'jetpack_termination_dialog_open', tracksProps );
	} );

	$( '#jetpack_deactivation_dialog_content__button-cancel' ).on( 'click', function( e ) {
		tb_remove();
		analytics.tracks.recordEvent( 'jetpack_termination_dialog_close_click', tracksProps );
	} );

	$( '#jetpack_deactivation_dialog_content__button-deactivate' ).on( 'click', function( e ) {
		analytics.tracks.recordEvent( 'jetpack_termination_dialog_termination_click', tracksProps );
		deactivateJetpack();
	} );
} )( jQuery );
