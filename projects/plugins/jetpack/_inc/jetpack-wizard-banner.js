/* global jQuery, jp_banner */

( function ( $ ) {
	var wizardBanner = $( '#jp-wizard-banner' );
	var wizardBannerDismiss = $( '.wizard-banner-dismiss' );
	var personalButton = $( '#jp-wizard-banner-personal-button' );
	var businessButton = $( '#jp-wizard-banner-business-button' );
	var skipLink = $( '.jp-wizard-banner-wizard-skip-link' );

	// Dismiss the wizard banner via AJAX
	wizardBannerDismiss.on( 'click', function () {
		$( wizardBanner ).hide();

		var data = {
			dismissBanner: true,
			action: 'jetpack_wizard_banner',
			nonce: jp_banner.wizardBannerNonce,
		};

		$.post( jp_banner.ajax_url, data, function ( response ) {
			if ( true !== response.success ) {
				$( wizardBanner ).show();
			}
		} );
	} );

	personalButton.on( 'click', function () {
		$.post( jp_banner.ajax_url, {
			personal: true,
			action: 'jetpack_wizard_banner',
			nonce: jp_banner.wizardBannerNonce,
		} );
	} );

	businessButton.on( 'click', function () {
		$.post( jp_banner.ajax_url, {
			business: true,
			action: 'jetpack_wizard_banner',
			nonce: jp_banner.wizardBannerNonce,
		} );
	} );

	skipLink.on( 'click', function () {
		$.post( jp_banner.ajax_url, {
			skip: true,
			action: 'jetpack_wizard_banner',
			nonce: jp_banner.wizardBannerNonce,
		} );
	} );
} )( jQuery );
