/*!
 * Jetpack CRM
 * https://jetpackcrm.com
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
		jQuery('#do-not-email').on('click',jpcrm_confirm_remove_unsubscribe_flag);
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
								zeroBSCRMJS_globViewLang('error') +
								':</strong> ' +
								zeroBSCRMJS_globViewLang('unabletodelete') +
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

// confirm removal of flag
function jpcrm_remove_unsubscribe_flag() {
	var payload = {
		action: 'jpcrm_update_meta',
		contact_id: zbsViewSettings['objid'],
		meta_key: 'do-not-email',
		_wpnonce: zbsViewSettings['update_meta_nonce']
	}
	request = jQuery.ajax({
		url: ajaxurl,
		type: "POST",
		data: payload,
		dataType: "json"
	});
	request.done(function(e) {
		// remove element from page
		document.getElementById('do-not-email').remove();
	});
	request.fail(function(e) {
		// error
		swal({
			title: zeroBSCRMJS_globViewLang('error'),
			type: 'error'
		});
	});
}

// confirmation popup for unsubscribe flag removal
function jpcrm_confirm_remove_unsubscribe_flag() {
	swal({
		title: zeroBSCRMJS_globViewLang('remove_unsubscribe_title'),
		text: zeroBSCRMJS_globViewLang('remove_unsubscribe_message'),
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#000',
		cancelButtonColor: '#fff',
		cancelButtonText: '<span style="color: #000">' + zeroBSCRMJS_globViewLang('cancel') + '</span>',
		confirmButtonText: zeroBSCRMJS_globViewLang('remove_unsubscribe_yes'),
	})
	.then(function (result) {
		if (result.value) {
			jpcrm_remove_unsubscribe_flag();
		} else {
			// cancel
		}
	})
}

/* ============================================================================================================
    / Generic helpers (view settings)
============================================================================================================ */

if ( typeof module !== 'undefined' ) {
	module.exports = { zbsCurrentlyDeleting, zeroBSCRMJS_initSingleView, zeroBSCRMJS_bindViewFiles,
		zeroBSCRMJS_viewContactInit, zeroBSCRMJS_viewCompanyInit,
		zeroBSCRMJS_bindGenericViewSettings, zeroBSCRMJS_bindActivityStream,
		jpcrm_remove_unsubscribe_flag, jpcrm_confirm_remove_unsubscribe_flag
	};
}
