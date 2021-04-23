/* global jQuery, jp_banner */

( function ( $ ) {
	var nav = $( '.jp-wpcom-connect__vertical-nav-container' ),
		contentContainer = $( '.jp-wpcom-connect__content-container' ),
		nextFeatureButtons = $( '.jp-banner__button-container .next-feature' ),
		fullScreenContainer = $( '.jp-connect-full__container' ),
		fullScreenDismiss = $( '.jp-connect-full__dismiss, .jp-connect-full__dismiss-paragraph' ),
		wpWelcomeNotice = $( '#welcome-panel' ),
		connectionBanner = $( '#message' ),
		connectionBannerDismiss = $( '.connection-banner-dismiss' ),
		deactivateLinkElem = $( 'tr[data-slug=jetpack] > td.plugin-title > div > span.deactivate > a' );

	// Move the banner below the WP Welcome notice on the dashboard
	$( window ).on( 'load', function () {
		wpWelcomeNotice.insertBefore( connectionBanner );
	} );

	var deactivateJetpackURL = deactivateLinkElem.attr( 'href' );

	window.deactivateJetpack = function () {
		window.location.href = deactivateJetpackURL;
	};

	var observer = new MutationObserver( function ( mutations ) {
		mutations.forEach( function ( mutation ) {
			if ( mutation.type === 'childList' ) {
				mutation.addedNodes.forEach( function ( addedNode ) {
					if ( 'TB_window' === addedNode.id ) {
						// NodeList is static, we need to modify this in the DOM

						$( '#TB_window' ).addClass( 'jetpack-disconnect-modal' );
						deactivationModalCentralize();

						$( '#TB_closeWindowButton, #TB_overlay' ).on( 'click', function ( e ) {
							document.onkeyup = '';
						} );

						document.onkeyup = function ( e ) {
							if ( e === null ) {
								// ie
								keycode = event.keyCode;
							} else {
								// mozilla
								keycode = e.which;
							}
							if ( keycode == 27 ) {
								// close
								document.onkeyup = '';
							}
						};

						observer.disconnect();
					}
				} );
			}
		} );
	} );

	window.deactivationModalCentralize = function () {
		var modal = $( '#TB_window.jetpack-disconnect-modal' );
		var top = $( window ).height() / 2 - $( modal ).height() / 2;
		$( modal ).css( 'top', top + 'px' );
	};

	var body = $( 'body' )[ 0 ];

	connectionBannerDismiss.attr(
		'href',
		'plugins.php#TB_inline?inlineId=jetpack_deactivation_dialog'
	);
	connectionBannerDismiss.attr( 'title', jp_banner.deactivate_title );
	connectionBannerDismiss.addClass( 'thickbox' );

	// Open dismiss deactivation dialog.
	connectionBannerDismiss.on( 'click', function () {
		observer.observe( body, { childList: true } );
	} );

	// Handle clicks inside the deactivation dialog.
	$( '#jetpack_deactivation_dialog_content__button-cancel' ).on( 'click', function ( e ) {
		tb_remove();
		document.onkeyup = '';
	} );

	$( '#jetpack_deactivation_dialog_content__button-deactivate' ).on( 'click', function ( e ) {
		e.preventDefault();

		$( this ).prop( 'disabled', true );
		deactivateJetpack();
	} );

	nav.on(
		'click',
		'.vertical-menu__feature-item:not( .vertical-menu__feature-item-is-selected )',
		function () {
			transitionSlideToIndex( $( this ).index() );
		}
	);

	nextFeatureButtons.on( 'click', function ( e ) {
		e.preventDefault();

		var slideIndex = $( this ).closest( '.jp-wpcom-connect__slide' ).index();

		transitionSlideToIndex( slideIndex + 1 );
	} );

	function transitionSlideToIndex( index ) {
		// Remove classes from previously selected menu item and content
		nav
			.find( '.vertical-menu__feature-item-is-selected' )
			.removeClass( 'vertical-menu__feature-item-is-selected' );

		contentContainer.find( '.jp__slide-is-active' ).removeClass( 'jp__slide-is-active' );

		// Add classes to selected menu item and content
		nav.children().eq( index ).addClass( 'vertical-menu__feature-item-is-selected' );

		contentContainer.children().eq( index ).addClass( 'jp__slide-is-active' );
	}

	/**
	 * Full-screen connection prompt
	 */
	fullScreenDismiss.on( 'click', function () {
		$( fullScreenContainer ).hide();
	} );

	$( document ).keyup( function ( e ) {
		if ( 27 === e.keyCode ) {
			$( fullScreenDismiss ).click();
		}
	} );
} )( jQuery );
