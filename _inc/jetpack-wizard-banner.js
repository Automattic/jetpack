/* global jQuery, jp_banner */

( function( $ ) {
	var wizardBanner = $( '#jp-wizard-banner' ),
		wizardBannerContainer = $( '#jp-wizard-banner-container' ),
		wizardBannerDismiss = $( '.wizard-banner-dismiss' );

	// Dismiss the wizard banner via AJAX
	wizardBannerDismiss.on( 'click', function() {
		$( wizardBanner ).hide();
		$( wizardBannerContainer ).hide();

		var data = {
			action: 'jetpack_wizard_banner',
			nonce: jp_banner.wizardBannerNonce,
			dismissBanner: true,
		};

		$.post( jp_banner.ajax_url, data, function( response ) {
			if ( true !== response.success ) {
				$( wizardBanner ).show();
			}
		} );
	} );
} )( jQuery );
