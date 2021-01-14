/* global jQuery, jp_banner */

( function ( $ ) {
	var recommendationsBanner = $( '#jp-recommendations-banner-main' );
	// var recommendationsBannerDismiss = $( '.wizard-banner-dismiss' );
	var recommendationsBannerContinue = $( '#jp-recommendations-banner-continue-button' );

	recommendationsBannerContinue.on( 'click', function () {
		var fieldNames = [ 'personal', 'business', 'store', 'other' ];
		var formData = {};
		fieldNames.forEach( function ( name ) {
			formData[ name ] = $( "input[name='" + name + "']" ).prop( 'checked' );
		} );

		$.post( jp_banner.ajax_url, {
			action: 'jetpack_recommendations_banner',
			nonce: jp_banner.nonce,
			...formData,
		} );
	} );

	// Dismiss the wizard banner via AJAX
	// wizardBannerDismiss.on( 'click', function () {
	//     $( wizardBanner ).hide();
	//
	//     var data = {
	//         dismissBanner: true,
	//         action: 'jetpack_wizard_banner',
	//         nonce: jp_banner.wizardBannerNonce,
	//     };
	//
	//     $.post( jp_banner.ajax_url, data, function ( response ) {
	//         if ( true !== response.success ) {
	//             $( wizardBanner ).show();
	//         }
	//     } );
	// } );
	//
	// personalButton.on( 'click', function () {
	//     $.post( jp_banner.ajax_url, {
	//         personal: true,
	//         action: 'jetpack_wizard_banner',
	//         nonce: jp_banner.wizardBannerNonce,
	//     } );
	// } );
	//
	// businessButton.on( 'click', function () {
	//     $.post( jp_banner.ajax_url, {
	//         business: true,
	//         action: 'jetpack_wizard_banner',
	//         nonce: jp_banner.wizardBannerNonce,
	//     } );
	// } );
	//
	// skipLink.on( 'click', function () {
	//     $.post( jp_banner.ajax_url, {
	//         skip: true,
	//         action: 'jetpack_wizard_banner',
	//         nonce: jp_banner.wizardBannerNonce,
	//     } );
	// } );
} )( jQuery );
