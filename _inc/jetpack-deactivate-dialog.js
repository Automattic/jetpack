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
						deactivationModalCentralize();

						$( '#TB_closeWindowButton, #TB_overlay' ).on( 'click', function( e ) {
							deactivationModalTrackCloseEvent();
						} );

						document.onkeyup = function( e ) {
							if ( e === null ) {
								// ie
								keycode = event.keyCode;
							} else {
								// mozilla
								keycode = e.which;
							}
							if ( keycode == 27 ) {
								// close
								deactivationModalTrackCloseEvent();
							}
						};

						observer.disconnect();
					}
				} );
			}
		} );
	} );

	window.deactivationModalCentralize = function() {
		var modal = $( '#TB_window.jetpack-disconnect-modal' );
		var top = $( window ).height() / 2 - $( modal ).height() / 2;
		$( modal ).css( 'top', top + 'px' );
	};

	window.deactivationModalTrackCloseEvent = function() {
		window.jpTracksAJAX.record_ajax_event( 'termination_dialog_close_click', 'click', tracksProps );
		document.onkeyup = '';
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
		window.jpTracksAJAX.record_ajax_event( 'termination_dialog_open', 'click', tracksProps );
	} );

	$( '#jetpack_deactivation_dialog_content__button-cancel' ).on( 'click', function( e ) {
		tb_remove();
		deactivationModalTrackCloseEvent();
	} );

	$( '#jetpack_deactivation_dialog_content__button-deactivate' ).on( 'click', function( e ) {
		e.preventDefault();

		$( this ).prop( 'disabled', true );

		window.jpTracksAJAX
			.record_ajax_event( 'termination_dialog_termination_click', 'click', tracksProps )
			.always( function() {
				deactivateJetpack();
			} );
	} );
} )( jQuery );
