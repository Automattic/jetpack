/* global jQuery, jp_banner */

( function( $ ) {
	var nav = $( '.jp-wpcom-connect__vertical-nav-container' ),
		contentContainer = $( '.jp-wpcom-connect__content-container' ),
		nextFeatureButtons = $( '.jp-banner__button-container .next-feature' ),
		fullScreenContainer = $( '.jp-connect-full__container' ),
		fullScreenDismiss = $( '.jp-connect-full__dismiss, .jp-connect-full__dismiss-paragraph' ),
		wpWelcomeNotice = $( '#welcome-panel' ),
		connectionBanner = $( '#message' ),
		placeholder = $( '.jp-loading-placeholder' ),
		connectionBannerDismiss = $( '.connection-banner-dismiss' );

	if ( placeholder && placeholder.length ) {
		fullScreenContainer.show();
		var shell = $( '<div class="jp-lower"></div>' ).html( fullScreenContainer );
		placeholder.hide().after( shell );
	}

	// Move the banner below the WP Welcome notice on the dashboard
	$( window ).on( 'load', function() {
		wpWelcomeNotice.insertBefore( connectionBanner );
	} );

	// Dismiss the connection banner via AJAX
	connectionBannerDismiss.on( 'click', function() {
		$( connectionBanner ).hide();

		var data = {
			action: 'jetpack_connection_banner',
			nonce: jp_banner.connectionBannerNonce,
			dismissBanner: true,
		};

		$.post( jp_banner.ajax_url, data, function( response ) {
			if ( true !== response.success ) {
				$( connectionBanner ).show();
			}
		} );
	} );

	nav.on(
		'click',
		'.vertical-menu__feature-item:not( .vertical-menu__feature-item-is-selected )',
		function() {
			transitionSlideToIndex( $( this ).index() );
		}
	);

	nextFeatureButtons.on( 'click', function( e ) {
		e.preventDefault();

		var slideIndex = $( this )
			.closest( '.jp-wpcom-connect__slide' )
			.index();

		transitionSlideToIndex( slideIndex + 1 );
	} );

	function transitionSlideToIndex( index ) {
		// Remove classes from previously selected menu item and content
		nav
			.find( '.vertical-menu__feature-item-is-selected' )
			.removeClass( 'vertical-menu__feature-item-is-selected' );

		contentContainer.find( '.jp__slide-is-active' ).removeClass( 'jp__slide-is-active' );

		// Add classes to selected menu item and content
		nav
			.children()
			.eq( index )
			.addClass( 'vertical-menu__feature-item-is-selected' );

		contentContainer
			.children()
			.eq( index )
			.addClass( 'jp__slide-is-active' );
	}

	/**
	 * Full-screen connection prompt
	 */
	fullScreenDismiss.on( 'click', function() {
		$( fullScreenContainer ).hide();
	} );

	$( document ).keyup( function( e ) {
		if ( 27 === e.keyCode ) {
			$( fullScreenDismiss ).click();
		}
	} );
} )( jQuery );
