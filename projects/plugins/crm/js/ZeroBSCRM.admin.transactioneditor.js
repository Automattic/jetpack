/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0+
 *
 * Copyright 2020 Automattic
 *
 * Date: 26/02/2019
 */

// v3.0 Transactions JS (as base currently)

jQuery( function () {
	// turn off auto-complete on records via form attr... should be global for all ZBS record pages
	// not v3.0jQuery('#post').attr('autocomplete','off');

	// on init, if customer has been selected, prefil inv list
	if ( jQuery( '#customer' ).val() ) {
		// any inv selected?
		var existingInvID = false;
		if ( jQuery( '#invoice_id' ).val() ) {
			existingInvID = jQuery( '#invoice_id' ).val();
		}

		zbscrmjs_build_custInv_dropdown( jQuery( '#customer' ).val(), existingInvID );
	}

	// bind
	setTimeout( function () {
		zeroBSCRMJS_showInvLinkIf();
		zeroBSCRMJS_showContactLinkIf( jQuery( '#customer' ).val() );
		zeroBSCRMJS_showCompanyLinkIf( jQuery( '#zbsct_company' ).val() );
	}, 0 );
} );

/**
 * @param o
 */
function zbscrmjs_transaction_unsetCustomer( o ) {
	if ( typeof o === 'undefined' || o == '' ) {
		jQuery( '#customer' ).val( '' );
		jQuery( '#customer_name' ).val( '' );

		// should also hide these!
		jQuery( '.assignInvToCust, #invoiceFieldWrap' ).hide();

		setTimeout( function () {
			// when inv select drop down changed, show/hide quick nav
			zeroBSCRMJS_showContactLinkIf( '' );
		}, 0 );
	}
}

/**
 * @param o
 */
function zbscrmjs_transaction_unsetCompany( o ) {
	if ( typeof o === 'undefined' || o == '' ) {
		jQuery( '#zbsct_company' ).val( '' );

		setTimeout( function () {
			// when inv select drop down changed, show/hide quick nav
			zeroBSCRMJS_showCompanyLinkIf( '' );
		}, 0 );
	}
}

// custom fuction to copy customer details from typeahead customer deets
/**
 * @param obj
 */
function zbscrmjs_transaction_setCustomer( obj ) {

	if ( typeof obj.id !== 'undefined' ) {
		// set vals
		jQuery( '#customer' ).val( obj.id );
		jQuery( '#customer_name' ).val( obj.name );

		// build inv dropdown
		zbscrmjs_build_custInv_dropdown( obj.id );
	} else {
		jQuery( '#customer' ).val( '' );
		jQuery( '#customer_name' ).val( '' );
	}

	setTimeout( function () {
		var lID = obj.id;

		// when inv select drop down changed, show/hide quick nav
		zeroBSCRMJS_showContactLinkIf( lID );
	}, 0 );
}

// custom fuction to copy company details from typeahead company deets
/**
 * @param obj
 */
function zbscrmjs_transaction_setCompany( obj ) {
	// console.log("Company Chosen!",obj);

	if ( typeof obj.id !== 'undefined' ) {
		// set vals
		jQuery( '#zbsct_company' ).val( obj.id );
	} else {
		// set vals
		jQuery( '#zbsct_company' ).val( '' );
	}

	setTimeout( function () {
		var lID = obj.id;

		// when inv select drop down changed, show/hide quick nav
		zeroBSCRMJS_showCompanyLinkIf( lID );
	}, 0 );
}

// this builds a dropdown of invoices against a customer
/**
 * @param custID
 * @param preSelectedInvID
 */
function zbscrmjs_build_custInv_dropdown( custID, preSelectedInvID ) {
	var previousInvVal = jQuery( '#invoice_id' ).val();

	// if cust id, retrieve inv list from ajax/cache
	if ( custID != '' ) {
		// show loading
		jQuery( '#invoiceFieldWrap' ).append( zbscrm_js_uiSpinnerBlocker() );

		zbscrm_js_getCustInvs(
			custID,
			function ( r ) {
				// successfully got list!
				// console.log("got list",[r,r.length]);

				// wrap
				var retHTML = '<select id="invoice_id" name="invoice_id" class="form-control">'; //form-control

				// if has invoices:
				if ( r.length > 0 ) {
					// def
					retHTML += '<option value="" disabled="disabled"';

					// if an inv id is passed, don't select this
					if ( typeof preSelectedInvID === 'undefined' || preSelectedInvID <= 0 ) {
						retHTML += ' selected="selected"';
					}

					retHTML += '>' + zeroBSCRMJS_transEditLang( 'selectinv', 'Select Invoice' ) + '</option>';
					retHTML +=
						'<option value="">' + zeroBSCRMJS_transEditLang( 'none', 'None' ) + '</option>';

					// cycle through + create
					jQuery.each( r, function ( ind, ele ) {
						// build a user-friendly str
						var invStr = '',
							invID = -1;

						// 3.0
						if ( zbscrm_JS_DAL() > 2 ) {
							// translated from admin.view php
							invID = ele.id;

							// id
							invStr = '#' + ele.id;

							// if ref, that too
							if ( typeof ele.id_override !== 'undefined' ) {
								invStr += ' - ' + ele.id_override;
							}
						} else {
							// <3.0
							invID = ele.id; //  POST id

							// #TRANSITIONTOMETANO
							if ( typeof ele.zbsid !== 'undefined' ) {
								invStr += '#' + ele.zbsid;
							} else {
								// forced to show post id as some kind of identifier..
								invStr += '#PID:' + ele.id;
							}
						}

						if ( typeof ele.meta !== 'undefined' ) {
							// val
							if ( typeof ele.meta.val !== 'undefined' ) {
								invStr += ' (' + window.zbs_root.currencyOptions.currencyStr + ele.meta.val + ')';
							}
							// date
							if ( typeof ele.meta.date !== 'undefined' ) {
								invStr += ' - ' + ele.meta.date;
							}
						}

						retHTML += '<option value="' + invID + '"';

						// if prefilled... select
						if ( typeof preSelectedInvID !== 'undefined' && invID == preSelectedInvID ) {
							retHTML += ' selected="selected"';
						}

						retHTML += '>' + invStr + '</option>';
					} );
				} else {
					// no invs
					retHTML +=
						'<option value="" disabled="disabled" selected="selected">' +
						zeroBSCRMJS_transEditLang( 'noinvoices', 'None Found' ) +
						'</option>';
				}

				// / wrap
				retHTML += '</select>';

				// output
				jQuery( '#invoiceFieldWrap' ).html( retHTML );

				// wh addition 20/7/18 - show when useful
				jQuery( '.assignInvToCust' ).show();

				// bind
				setTimeout( function () {
					zeroBSCRMJS_bindInvSelect();
				}, 0 );
			},
			function ( r ) {
				// wh addition 20/7/18 - hide until useful
				jQuery( '.assignInvToCust' ).hide();

				// failed to get... leave as manual

				// localise
				var previousInvValL = previousInvVal;
				if ( previousInvValL == 0 ) {
					var previousInvValL = '';
				}

				// NOTE THIS IS DUPE BELOW... REFACTOR
				jQuery( '#invoiceFieldWrap' ).html(
					'<input style="max-width:200px;" id="invoice_id" name="invoice_id" value="' +
						previousInvValL +
						'" class="form-control">'
				);
			}
		);
	} else {
		// wh addition 20/7/18 - hide until useful
		jQuery( '.assignInvToCust' ).show();

		// leave as manual entry (but maybe later do not allow?)
		if ( previousInvVal == 0 ) {
			var previousInvVal = '';
		}
		// NOTE THIS IS DUPE ABOVE... REFACTOR
		jQuery( '#invoiceFieldWrap' ).html(
			'<input style="max-width:200px;" id="invoice_id" name="invoice_id" value="' +
				previousInvVal +
				'" class="form-control">'
		);

		// bind
		setTimeout( function () {
			zeroBSCRMJS_bindInvSelect();
		}, 0 );
	}
}

// when inv select drop down changed, show/hide quick nav
/**
 *
 */
function zeroBSCRMJS_bindInvSelect() {
	jQuery( '#invoice_id' ).on( 'change', function () {
		zeroBSCRMJS_showInvLinkIf();
	} );

	zeroBSCRMJS_showInvLinkIf();
}

// if an inv is selected (against a trans) can 'quick nav' to inv
/**
 *
 */
function zeroBSCRMJS_showInvLinkIf() {
	// remove old
	//jQuery('#invoiceFieldWrap .zbs-view-invoice').remove();
	jQuery( '#invoiceSelectionTitle .zbs-view-invoice' ).remove();

	// see if selected
	var inv = jQuery( '#invoiceFieldWrap select' ).val();

	if ( typeof inv !== 'undefined' && inv !== null && inv !== '' ) {
		inv = parseInt( inv );
		if ( inv > 0 ) {
			// seems like a legit inv, add

			var html =
				'<div class="ui right floated mini animated button zbs-view-invoice" style="margin-left:0.5em">';
			html +=
				'<div class="visible content">' + zeroBSCRMJS_transEditLang( 'view', 'View' ) + '</div>';
			html += '<div class="hidden content">';
			html += '<i class="icon file text"></i>';
			html += '</div>';
			html += '</div>';

			jQuery( '#invoiceSelectionTitle' ).prepend( html );

			// bind
			zeroBSCRMJS_bindInvLinkIf();
		}
	}
}

// click for quicknav :)
/**
 *
 */
function zeroBSCRMJS_bindInvLinkIf() {
	jQuery( '#invoiceSelectionTitle .zbs-view-invoice' )
		.off( 'click' )
		.on( 'click', function () {
			var invID = parseInt( jQuery( '#invoiceFieldWrap select' ).val() ); //jQuery(this).attr('data-invid');

			var url = window.zeroBSCRMJS_transactionedit_links.editinvprefix + invID;

			// bla bla https://stackoverflow.com/questions/1574008/how-to-simulate-target-blank-in-javascript
			window.open( url, '_parent' );
		} );
}

// if an contact is selected (against a trans) can 'quick nav' to contact
/**
 * @param contactID
 */
function zeroBSCRMJS_showContactLinkIf( contactID ) {
	// remove old
	jQuery( '#zbs-customer-title .zbs-view-contact' ).remove();
	jQuery( '#zbs-transaction-learn-nav .zbs-trans-quicknav-contact' ).remove();

	if ( typeof contactID !== 'undefined' && contactID !== null && contactID !== '' ) {
		contactID = parseInt( contactID );
		if ( contactID > 0 ) {
			var url = window.zbsObjectViewLinkPrefixCustomer + contactID;

			var html = '<div class="ui right floated mini animated button zbs-view-contact">';
			html +=
				'<div class="visible content">' + zeroBSCRMJS_transEditLang( 'view', 'View' ) + '</div>';
			html += '<div class="hidden content">';
			html += '<i class="user icon"></i>';
			html += '</div>';
			html += '</div>';

			jQuery( '#zbs-customer-title' ).prepend( html );

			// ALSO show in header bar, if so
			var navButton =
				'<a target="_blank" style="margin-left:6px;" class="zbs-trans-quicknav-contact ui icon button black mini labeled" href="' +
				url +
				'"><i class="user icon"></i> ' +
				zeroBSCRMJS_transEditLang( 'contact', 'Contact' ) +
				'</a>';
			jQuery( '#zbs-transaction-learn-nav' ).append( navButton );

			// bind
			zeroBSCRMJS_bindContactLinkIf();
		}
	}
}

// click for quicknav :)
/**
 *
 */
function zeroBSCRMJS_bindContactLinkIf() {
	jQuery( '#zbs-customer-title .zbs-view-contact' )
		.off( 'click' )
		.on( 'click', function () {
			// get from hidden input
			var contactID = parseInt( jQuery( '#customer' ).val() ); //jQuery(this).attr('data-invid');

			if ( typeof contactID !== 'undefined' && contactID !== null && contactID !== '' ) {
				contactID = parseInt( contactID );
				if ( contactID > 0 ) {
					var url = window.zbsObjectViewLinkPrefixCustomer + contactID;
					window.open( url, '_parent' );
				}
			}
		} );
}

// if an Company is selected (against a trans) can 'quick nav' to Company
/**
 * @param companyID
 */
function zeroBSCRMJS_showCompanyLinkIf( companyID ) {
	// remove old
	jQuery( '#zbs-company-title .zbs-view-company' ).remove();
	jQuery( '#zbs-transaction-learn-nav .zbs-trans-quicknav-company' ).remove();

	if ( typeof companyID !== 'undefined' && companyID !== null && companyID !== '' ) {
		companyID = parseInt( companyID );
		if ( companyID > 0 ) {
			// seems like a legit inv, add

			var html = '<div class="ui right floated mini animated button zbs-view-company">';
			html +=
				'<div class="visible content">' + zeroBSCRMJS_transEditLang( 'view', 'View' ) + '</div>';
			html += '<div class="hidden content">';
			html += '<i class="building icon"></i>';
			html += '</div>';
			html += '</div>';

			jQuery( '#zbs-company-title' ).prepend( html );

			// ALSO show in header bar, if so
			var navButton =
				'<a target="_blank" style="margin-left:6px;" class="zbs-trans-quicknav-company ui icon button black mini labeled" href="' +
				window.zeroBSCRMJS_transactionedit_links.editcompanyprefix +
				companyID +
				'"><i class="building icon"></i> ' +
				zeroBSCRMJS_transEditLang( 'company', 'Company' ) +
				'</a>';
			jQuery( '#zbs-transaction-learn-nav' ).append( navButton );

			// bind
			zeroBSCRMJS_bindCompanyLinkIf();
		}
	}
}

// click for quicknav :)
/**
 *
 */
function zeroBSCRMJS_bindCompanyLinkIf() {
	jQuery( '#zbs-company-title .zbs-view-company' )
		.off( 'click' )
		.on( 'click', function () {
			// get from hidden input
			var companyID = parseInt( jQuery( '#zbsct_company' ).val() ); //jQuery(this).attr('data-invid');

			if ( typeof companyID !== 'undefined' && companyID !== null && companyID !== '' ) {
				companyID = parseInt( companyID );
				if ( companyID > 0 ) {
					var url = window.zeroBSCRMJS_transactionedit_links.editcompanyprefix + companyID;

					// bla bla https://stackoverflow.com/questions/1574008/how-to-simulate-target-blank-in-javascript
					window.open( url, '_parent' );
				}
			}
		} );
}

// passes language from window.zeroBSCRMJS_transactionedit_lang (js set in trans edit php)
/**
 * @param key
 * @param fallback
 */
function zeroBSCRMJS_transEditLang( key, fallback ) {
	if ( typeof fallback === 'undefined' ) {
		var fallback = '';
	}

	if ( typeof window.zeroBSCRMJS_transactionedit_lang[ key ] !== 'undefined' ) {
		return window.zeroBSCRMJS_transactionedit_lang[ key ];
	}

	return fallback;
}

if ( typeof module !== 'undefined' ) {
    module.exports = { zbscrmjs_transaction_unsetCustomer, zbscrmjs_transaction_unsetCompany,
		zbscrmjs_transaction_setCustomer, zbscrmjs_transaction_setCompany,
		zbscrmjs_build_custInv_dropdown, zeroBSCRMJS_bindInvSelect,
		zeroBSCRMJS_showInvLinkIf, zeroBSCRMJS_bindInvLinkIf,
		zeroBSCRMJS_showContactLinkIf, zeroBSCRMJS_bindContactLinkIf,
		zeroBSCRMJS_showCompanyLinkIf, zeroBSCRMJS_bindCompanyLinkIf,
		zeroBSCRMJS_transEditLang };
}
