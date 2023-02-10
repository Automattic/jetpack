/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.81+
 *
 * Copyright 2018 ZeroBSCRM.com
 *
 * Date: 22/05/18
 */
jQuery( function () {
	// init if settings there (not on non-listview pages)
	if ( typeof window.zbsViewSettings !== 'undefined' ) {
		zeroBSCRMJS_initSingleView();
	}

	// check type :)
	if (
		typeof window.zbsViewSettings !== 'undefined' &&
		typeof window.zbsViewSettings.objdbname !== 'undefined' &&
		window.zbsViewSettings.objdbname == 'contact'
	) {
		zeroBSCRMJS_viewContactInit();
	} // is contact

	// check type :)
	if (
		typeof window.zbsViewSettings !== 'undefined' &&
		typeof window.zbsViewSettings.objdbname !== 'undefined' &&
		window.zbsViewSettings.objdbname == 'company'
	) {
		zeroBSCRMJS_viewCompanyInit();
	} // is company
} );

/**
 *
 */
function zeroBSCRMJS_initSingleView() {
	// generic

	// view settings (if button)
	zeroBSCRMJS_bindGenericViewSettings();
}

var zbsCurrentlyDeleting = false;
/**
 *
 */
function zeroBSCRMJS_bindViewFiles() {
	// delete file
	jQuery( '.zbsDelFile' ).on( 'click', function () {
		// get type
		var delType = 'customer';
		if ( jQuery( this ).attr( 'data-type' ) == 'company' ) {
			delType = 'company';
		}

		if ( ! window.zbsCurrentlyDeleting ) {
			// blocking
			window.zbsCurrentlyDeleting = true;

			var delUrl = jQuery( this ).attr( 'data-delurl' );
			//var lineIDtoRemove = jQuery(this).closest('.zbsFileLine').attr('id');
			var lineToRemove = jQuery( this ).closest( 'tr' );

			var objID = -1;
			if (
				typeof window.zbsViewSettings !== 'undefined' &&
				typeof window.zbsViewSettings.objid !== 'undefined'
			) {
				var objID = window.zbsViewSettings.objid;
			}

			if ( typeof delUrl !== 'undefined' && delUrl != '' && objID > 0 ) {
				// postbag!
				var data = {
					action: 'delFile',
					zbsfType: delType,
					zbsDel: delUrl, // could be csv, never used though
					zbsCID: objID,
					sec: window.zbscrmjs_secToken,
				};

				// Send it Pat :D
				jQuery.ajax( {
					type: 'POST',
					url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
					data: data,
					dataType: 'json',
					timeout: 20000,
					success: function ( response ) {
						var localLineToRemove = lineToRemove,
							localDelURL = delUrl;

						// visually remove
						jQuery( localLineToRemove ).remove();

						// show 'none' if none
						var newNumber = jQuery( '#zbsFilesTable tr' ).length - 1;
						if ( newNumber == 1 ) {
							jQuery( '#zbs-no-files-msg' ).show();
						}

						// file deletion errors, show msg:
						if ( typeof response.errors !== 'undefined' && response.errors.length > 0 ) {
							jQuery.each( response.errors, function ( ind, ele ) {
								jQuery( '#zbsFilesTable' ).after(
									'<div class="ui warning message" style="margin-top:10px;">' + ele + '</div>'
								);
							} );
						}
					},
					error: function ( response ) {
						jQuery( '#zbsFilesTable' ).append(
							'<div class="ui warning message" style="margin-top:10px;"><strong>' +
								window.zbsViewLang.error +
								':</strong> ' +
								window.zbsViewLang.unabletodelete +
								'</div>'
						);
					},
				} );
			}

			window.zbsCurrentlyDeleting = false;
		} // / blocking
	} );
}

/* ============================================================================================================

    View contact specific JS - taken from Admin.View

============================================================================================================ */

// Contact View specifics
/**
 *
 */
function zeroBSCRMJS_viewContactInit() {
	//any code in here specific for edit customer page
	console.log( '======== CUSTOMER VIEW SCRIPTS =============' );

	// init tabs
	//jQuery('.tabular.menu .item').tab();
	jQuery( '#zbs-vitals-box .tabular.menu .item' ).tab( {
		context: '#zbs-vitals-box',
		//childrenOnly: true
	} );
	jQuery( '#zbs-doc-menu .tabular.menu .item' ).tab( {
		//childrenOnly: true//context: jQuery('#zbs-doc-menu')
		context: '#zbs-doc-menu',
	} );

	// actions drop down
	jQuery( '.ui.dropdown' ).dropdown();

	// action items
	jQuery( '.zbs-contact-action' )
		.off( 'click' )
		.on( 'click', function () {
			// get action type (at launch, only url)
			var actionType = jQuery( this ).attr( 'data-action' );

			if ( typeof actionType !== 'undefined' ) {
				switch ( actionType ) {
					case 'url':
						var u = jQuery( this ).attr( 'data-url' );
						if ( typeof u !== 'undefined' && u != '' ) {
							window.location = u;
						}

						break;
				}
			}
		} );

	jQuery( '.zbs-view-vital-label i.info' ).popup( {
		//boundary: '.boundary.example .segment'
	} );

	// files
	zeroBSCRMJS_bindViewFiles();

	// log long desc toggles
	zeroBSCRMJS_bindActivityStream();
}

/* ============================================================================================================

    View contact specific JS - taken from Admin.View

============================================================================================================ */

/* ============================================================================================================
    View Company specific JS
============================================================================================================ */

// Company View specifics
/**
 *
 */
function zeroBSCRMJS_viewCompanyInit() {
	//any code in here specific for edit customer page
	console.log( '======== COMPANY VIEW SCRIPTS =============' );

	// init tabs
	//jQuery('.tabular.menu .item').tab();
	jQuery( '#zbs-vitals-box .tabular.menu .item' ).tab( {
		context: '#zbs-vitals-box',
		//childrenOnly: true
	} );
	jQuery( '#zbs-doc-menu .tabular.menu .item' ).tab( {
		//childrenOnly: true//context: jQuery('#zbs-doc-menu')
		context: '#zbs-doc-menu',
	} );
	/*
        // actions drop down
        jQuery('.ui.dropdown').dropdown();

        // action items
        jQuery('.zbs-contact-action').off('click').on( 'click', function(){

          // get action type (at launch, only url)
          var actionType = jQuery(this).attr('data-action');

          if (typeof actionType != "undefined") switch (actionType){

              case 'url':

                  var u = jQuery(this).attr('data-url');
                  if (typeof u != "undefined" && u != '') window.location = u;

                  break;

          }

        });
*/
	jQuery( '.zbs-view-vital-label i.info' ).popup( {
		//boundary: '.boundary.example .segment'
	} );

	// files
	zeroBSCRMJS_bindViewFiles();
}

/* ============================================================================================================
   /  View Company specific JS
============================================================================================================ */

/* ============================================================================================================
    Generic helpers (view settings)
============================================================================================================ */

/**
 *
 */
function zeroBSCRMJS_bindGenericViewSettings() {}

/**
 *
 */
function zeroBSCRMJS_bindActivityStream() {
	// log long desc toggles
	jQuery( '.zbs-show-longdesc' )
		.off( 'click' )
		.on( 'click', function () {
			jQuery( this ).closest( '.zbs-single-log' ).addClass( 'zbs-long-desc-show' );
		} );
	jQuery( '.zbs-hide-longdesc' )
		.off( 'click' )
		.on( 'click', function () {
			jQuery( this ).closest( '.zbs-single-log' ).removeClass( 'zbs-long-desc-show' );
		} );
}

/* ============================================================================================================
    / Generic helpers (view settings)
============================================================================================================ */

if ( typeof module !== 'undefined' ) {
    module.exports = { zbsCurrentlyDeleting, zeroBSCRMJS_initSingleView, zeroBSCRMJS_bindViewFiles,
		zeroBSCRMJS_viewContactInit, zeroBSCRMJS_viewCompanyInit,
		zeroBSCRMJS_bindGenericViewSettings, zeroBSCRMJS_bindActivityStream };
}