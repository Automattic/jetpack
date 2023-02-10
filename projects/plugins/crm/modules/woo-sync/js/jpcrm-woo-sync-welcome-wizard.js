/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync Hub page JS
 */

var jpcrm_woo_options = {
	jpcrm_wcsetuptype: 0,

	jpcrm_wcdomain: '',
	jpcrm_wckey: '',
	jpcrm_wcsecret: '',
	jpcrm_wcprefix: '',

	jpcrm_wcinv: 1,
	jpcrm_wctagcust: 1,
	jpcrm_wcacc: 1,
};

jQuery( document ).ready( function () {
	jQuery( '#external-install' ).hide();

	jQuery( '#back-to-setup-type' ).on( 'click', function () {
		jQuery( '#step-1-button' ).click();
	} );
	jQuery( '#back-to-api-info' ).on( 'click', function () {
		jQuery( '#step-2-button' ).click();
	} );
	jQuery( '#back-to-options' ).on( 'click', function () {
		jQuery( '#step-3-button' ).click();
	} );

	jQuery( '.choose .btn' ).on( 'click', function () {
		window.jpcrm_woo_options.jpcrm_wcsetuptype = jQuery( this ).data( 'setup' );

		jQuery( '#jpcrm-woo-setup-' + window.jpcrm_woo_options.jpcrm_wcsetuptype + ' .selected' ).show();
		jQuery( '#jpcrm-woo-setup-' + window.jpcrm_woo_options.jpcrm_wcsetuptype + ' .choose' ).hide();

		if ( window.jpcrm_woo_options.jpcrm_wcsetuptype == 1 ) {
			jQuery( '#jpcrm-woo-setup-0 .choose' ).show();
			jQuery( '#jpcrm-woo-setup-0 .selected' ).hide();
			jQuery( '#sc-0' ).removeClass( 'setup-selected' );
			jQuery( '#sc-1' ).addClass( 'setup-selected' );
			jQuery( '#external-install' ).show();
			jQuery( '#same-install' ).hide();
		} else {
			jQuery( '#jpcrm-woo-setup-1 .choose' ).show();
			jQuery( '#jpcrm-woo-setup-1 .selected' ).hide();
			jQuery( '#sc-1' ).removeClass( 'setup-selected' );
			jQuery( '#sc-0' ).addClass( 'setup-selected' );
			jQuery( '#external-install' ).hide();
			jQuery( '#same-install' ).show();
		}
	} );

	var navListItems = jQuery( 'div.setup-panel div a' ),
		allWells = jQuery( '.setup-content' ),
		allNextBtn = jQuery( '.nextBtn' ),
		alBackBtn = jQuery( '.backBtn' ),
		alListBtn = jQuery( '.stepwizard-step' );
	allWells.hide();
	navListItems.on( 'click', function ( e ) {
		e.preventDefault();
		var jQuerytarget = jQuery( jQuery( this ).attr( 'href' ) ),
			jQueryitem = jQuery( this );
		if ( ! jQueryitem.hasClass( 'disabled' ) ) {
			navListItems.removeClass( 'btn-primary' ).addClass( 'btn-default' );
			jQueryitem.addClass( 'btn-primary' );
			allWells.hide();
			jQuerytarget.show();
			jQuerytarget.find( 'input:eq(0)' ).trigger( 'focus' );
		}
	} );

	alListBtn.on( 'click', function () {
		jpcrm_woosync_update_details();
	} );

	allNextBtn.on( 'click', function () {
		var curStep = jQuery( this ).closest( '.setup-content' ),
			curStepBtn = curStep.attr( 'id' ),
			nextStepWizard = jQuery( 'div.setup-panel div a[href="#' + curStepBtn + '"]' )
				.parent()
				.next()
				.children( 'a' ),
			curInputs = curStep.find( "input[type='text'],input[type='url']" ),
			isValid = true;
		jQuery( '.form-group' ).removeClass( 'has-error' );
		for ( var i = 0; i < curInputs.length; i++ ) {
			if ( ! curInputs[ i ].validity.valid ) {
				isValid = false;
				jQuery( curInputs[ i ] ).closest( '.form-group' ).addClass( 'has-error' );
			}
		}
		if ( isValid ) {
			nextStepWizard.prop( 'disabled', false ).trigger( 'click' );
		}
	} );

	jQuery( 'div.setup-panel div a.btn-primary' ).trigger( 'click' );

	jQuery( '.jpcrm-gogogo' )
		.off( 'click' )
		.on( 'click', function ( e ) {
			jpcrm_woosync_update_details();

			if ( jQuery( this ).hasClass( 'disabled' ) ) {
				return false;
			}
			jQuery( this ).addClass( 'disabled' );

			var t = window.jpcrm_woo_options;

			t.action = 'jpcrm_woosync_wizard_finished';
			t.security = jQuery( '#jpcrm-woo-wizard-ajax-nonce' ).val();

			jQuery( '.laststage' ).hide();
			jQuery( '.finishingupblock' ).show();
			jQuery( '.finishblock' ).hide();

			i = jQuery.ajax( {
				url: window.ajaxurl,
				type: 'POST',
				data: t,
				dataType: 'json',
			} );
			i.done( function ( msg ) {
				jQuery( '.laststage' ).hide();
				jQuery( '.finishingupblock' ).hide();
				jQuery( '.finishblock' ).show();
			} );
			i.fail( function ( msg ) {
				jQuery( '.laststage' ).hide();
				jQuery( '.finishingupblock' ).hide();
				jQuery( '.finishblock' ).show();
			} );
		} );
} );

/**
 *
 */
function jpcrm_woosync_update_details() {
	window.jpcrm_woo_options.jpcrm_wcdomain = jQuery( '#jpcrm_wcdomain' ).val();
	window.jpcrm_woo_options.jpcrm_wckey = jQuery( '#jpcrm_wckey' ).val();
	window.jpcrm_woo_options.jpcrm_wcsecret = jQuery( '#jpcrm_wcsecret' ).val();
	window.jpcrm_woo_options.jpcrm_wcprefix = jQuery( '#jpcrm_wcprefix' ).val();

	window.jpcrm_woo_options.jpcrm_wcinv = jQuery( '#jpcrm_wcinv' ).is( ':checked' ) ? 1 : 0;
	window.jpcrm_woo_options.jpcrm_wctagcust = jQuery( '#jpcrm_wctagcust' ).is( ':checked' ) ? 1 : 0;
	window.jpcrm_woo_options.jpcrm_wcacc = jQuery( '#jpcrm_wcacc' ).is( ':checked' ) ? 1 : 0;
}

if ( typeof module !== 'undefined' ) {
    module.exports = { jpcrm_woo_options, jpcrm_woosync_update_details };
}
