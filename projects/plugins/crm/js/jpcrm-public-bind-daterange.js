/*
 * This file binds date pickers only for date pickers that don't use time and
 * allow empty selections.
 *
 * I repeat: IT ONLY WORKS FOR DATE PICKERS THAT DON`T USE TIME (HH:MM:SS) AND
 * ALLOW EMPTY SELECTIONS.
 *
 * If needed these can be put here.
 */

jQuery( function () {
	jpcrm_js_client_portal_bind_daterangepicker();
} );

/*
 * Function that binds the daterangepicker for the fields that have specific
 * css classes.
 */
/**
 *
 */
function jpcrm_js_client_portal_bind_daterangepicker() {
	if ( typeof jQuery( '.zbs-date' ).daterangepicker === 'function' ) {
		// JPCRM_PUBLIC_LOCALE_OPT_FOR_DATERANGEPICKER is a constant defined inline and it comes from PHP
		var locale_opt = JPCRM_PUBLIC_LOCALE_OPT_FOR_DATERANGEPICKER;
		var daterangepicker_opts = {
			locale: locale_opt,
			timePicker: false,
			showDropdowns: true,
			autoUpdateInput: false,
			singleDatePicker: true,
		};

		jQuery( '.zbs-date.zbs-empty-start' ).daterangepicker(
			daterangepicker_opts,
			function ( chosen_date ) {
				this.element.val( chosen_date.format( locale_opt.format ) );
			}
		);

		jQuery( '.zbs-date.zbs-empty-start' ).on( 'apply.daterangepicker', function ( ev, picker ) {
			if ( picker.element.val() == '' ) {
				picker.callback( picker.startDate );
			}
		} );
	}
}

if ( typeof module !== 'undefined' ) {
    module.exports = { jpcrm_js_client_portal_bind_daterangepicker };
}
