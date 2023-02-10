/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.0
 *
 * Copyright 2017-2019, Jetpack CRM Software Ltd. & Jetpack CRM.com
 *
 * Date: 23rd Jan 2019
 */

// ========================================================================
// ======= Globals
// ========================================================================

var zbs_invoice = false; // stores data of this inv (post init)
var zbs_tax = false; // ?
var zbs_tax_table = false; // stores tax table
var zbsInvBlocker = false; // this is a blocker... ctrl F it

// ========================================================================
// ======= /Globals
// ========================================================================

// ========================================================================
// ======= Initialisation
// ========================================================================

jQuery( function () {
	//hide the annoying toggle
	jQuery( '.handlediv' ).remove();
	jQuery( '.ui-sortable-handle' ).remove();
	jQuery( '.hndle' ).css( 'cursor', 'default' );

	// DAL3.0 can return this nicer (WP will increment it each page refresh, storing it in auto_draft)
	// but DAL3.0 should return the next available ID and reserve it?
	// WH - how do we handle the case where YOU and I make a new invoice (same time)
	// we fill it in, and the ID is the same - won't we have a race condition here?
	invoice_id = jQuery( '.zbs_invoice_html_canvas' ).data( 'invid' );

	//draw the invoice HTML UI (v2.98) start by drawing the data from the DB (drawing / getting)
	zbscrm_JS_retrieve_invoice_data( invoice_id );

	// hack for weird tax bug
	if ( jQuery( '#invoice_tax_total' ).val() > 0 ) {
		jQuery( '#invoice_totals .tax_total' ).show();
	}
} );

// ========================================================================
// ======= / Initialisation
// ========================================================================

// ========================================================================
// ======= AJAX/DATA
// ========================================================================

//PASS THE TRANSLATION TO THIS VIA LOCALISE SCRIPT FUNCTION TO KEEP META BOX PAGE TIDY
//the getting of the invoice - using the data array returned from the AJAX call above (which is in the Jetpack CRMCRM.Control.Invoices.php)
//  Retrieve the Invoice data from AJAX.
/**
 * @param id
 */
function zbscrm_JS_retrieve_invoice_data( id ) {
	// get the invoice data (pass security to this once data outputs OK)
	var data = {
		action: 'zbs_get_invoice_data',
		sec: window.zbscrmjs_secToken,
		invid: id,
	};
	jQuery.ajax( {
		type: 'POST',
		url: ajaxurl,
		data: data,
		dataType: 'json',
		timeout: 20000,
		success: function ( res ) {
			// localise inv data
			if ( typeof res !== 'undefined' ) {
				window.zbs_invoice = res;
			}

			// localise tax table data
			if ( typeof res.tax_linesObj !== 'undefined' ) {
				window.zbs_tax_table = res.tax_linesObj;
			}

			// localise tax data
			if (
				typeof res.invoiceObj !== 'undefined' &&
				typeof res.invoiceObj.settings !== 'undefined' &&
				typeof res.invoiceObj.settings.invtax !== 'undefined'
			) {
				window.zbs_tax = res.invoiceObj.settings.invtax;
			}

			// draw actual inv builder html
			zbscrm_JS_draw_invoice_html();
		},
		error: function ( res ) {
			// err callback? show msg (prefilled by php)
			jQuery( '#zbsCantLoadDataSingle' ).show();
			// hide rest of page:
			jQuery( '#zbs-edit-wrap, #zbs-screen-options' ).hide();
			// hide this to show msg properly, also
			jQuery( '#zbs_loader, #zbs_invoice' ).hide();
		},
	} );
}

// ========================================================================
// ======= /AJAX/DATA
// ========================================================================

// ========================================================================
// ======= Drawing/HTML Gen
// ========================================================================

//the drawing of the HTML - using the data array returned from the AJAX call above (which is in the Jetpack CRMCRM.Control.Invoices.php)
/**
 *
 */
function zbscrm_JS_draw_invoice_html() {
	// if loaded
	if ( typeof window.zbs_invoice !== 'undefined' && window.zbs_invoice !== false ) {
		// clear in case prev. shown
		jQuery( '#zbsCantLoadDataSingle' ).hide();
		//show rest of page:
		jQuery( '#zbs-edit-wrap, #zbs-screen-options' ).show();
		jQuery( '#zbs_loader, #zbs_invoice' ).show();

		// define
		var html = '';

		// draw the HTML with this function ...
		html = zbscrm_JS_draw_invoice_actions_html( window.zbs_invoice );

		html += '<div id="zbs_top_wrapper">';

		//the logo
		html += zbscrm_JS_draw_invoice_logo_html( window.zbs_invoice );

		//the form elements top right
		html += zbscrm_JS_draw_invoice_top_right_form( window.zbs_invoice );

		html += '</div>';

		// WH: prefer without: html += '<hr/>';

		html += '<div style="clear:both">&nbsp;</div><div id="zbs_sub_wrapper" class="ui grid">';

		html += '<div class="six wide column">';
		//the business info block (controlled via settings)
		html += zbscrm_JS_draw_invoice_biz_info( window.zbs_invoice );
		html += '</div>';

		html += '<div class="ten wide column">';
		///send to (fancy new UI for type-ahead returning company or contact)
		html += zbscrm_JS_draw_send_invoice_to( window.zbs_invoice );
		html += '</div>';

		html += '</div>';

		//customiser
		html += zbscrm_JS_draw_customise( window.zbs_invoice );

		// line itmes
		html += zbscrm_JS_draw_line_items( window.zbs_invoice );

		//calculates from the line items..
		html += zbscrm_JS_draw_invoice_totals( window.zbs_invoice );

		//the partials table output
		html += zbscrm_JS_draw_partials_table( window.zbs_invoice );

		//the final output..
		jQuery( '.zbs_invoice_html_canvas' ).html( html );

		//bind the additional elements here for click actions on the HTML generated and inserted here
		// setTimeout 0 makes sure we do this AFTER html has been rendered.
		setTimeout( function () {
			// and we then inject custom fields
			jQuery( '#zbs-invoice-custom-fields-holder table tr' ).appendTo(
				'.zbs-invoice-topper table'
			);

			zbscrm_JS_bind_row_actions();
			zbscrm_JS_bind_change_actions();
			zbscrm_JS_bind_invoice_actions();

			// loaded
			jQuery( '#zbs_loader' ).hide();
		}, 0 );
	} else {
		// no inv loaded ?

		// err callback? show msg (prefilled by php)
		jQuery( '#zbsCantLoadDataSingle' ).show();
		// hide rest of page:
		jQuery( '#zbs-edit-wrap, #zbs-screen-options' ).hide();
		// hide this to show msg properly, also
		jQuery( '#zbs_loader, #zbs_invoice' ).hide();
	}
}

//draws the status line (and links that are present (download PDF, preview, send))
/**
 * @param res
 */
function zbscrm_JS_draw_invoice_actions_html( res ) {
	// debug console.log('zbscrm_JS_draw_invoice_actions_html',res);

	html = '';
	html += '<div id="zbs_invoice_actions">';

	html += '<div class="zbs-invoice-status">';
	html += '<span class="' + res.invoiceObj.status + ' statty">' + res.invoiceObj.status + '</span>';
	html += '</div>';

	//now the preview, download pdf, and send buttons controlled by the data output (not via complex PHP ifs on page)
	//we now have invoice hashes so can use the invoice hash to display an invoice which can be accessed outside the portal
	//and paid for. Will only show buy now OR the stripe button (and a message that payment source will be updated if paid via this page)
	if ( ! res.invoiceObj.new_invoice ) {
		// if user has the client portal active, show preview link
		if ( res.invoiceObj.portal_installed ) {
			html +=
				'<a href="' +
				res.invoiceObj.preview_link +
				'" target="_blank" class="ui button blue" id="zbs_invoice_preview">' +
				zbscrm_JS_invoice_lang( 'preview' ) +
				'</a>';
		}

		//pdf download only displayed in PDF set.
		if ( res.invoiceObj.pdf_installed ) {
			html +=
				'<button id="zbs_invoicing_download_pdf" type="button" class="ui button olive">' +
				zbscrm_JS_invoice_lang( 'dl_pdf' ) +
				'</button>';
			Formhtml =
				'<form target="_blank" method="post" id="zbs_invoicing_download_pdf_form" action="">';
			Formhtml += '<input type="hidden" name="zbs_invoicing_download_pdf" value="1" />';
			Formhtml += '<input type="hidden" name="zbs_invoice_id" value="' + res.invoiceObj.id + '" />';
			Formhtml += '</form>';
			jQuery( '#wpbody' ).append( Formhtml );
		}

		// send email button
		// ONLY show if email template active for invoices + has valid email in billto
		if ( typeof window.zbsJS_invEmailActive !== 'undefined' && window.zbsJS_invEmailActive == 1 ) {
			var potentialEmail = zbscrmJS_retrieveCurrentBillToEmail();
			if (
				typeof potentialEmail !== 'undefined' &&
				potentialEmail != '' &&
				zbscrm_JS_validateEmail( potentialEmail )
			) {
				html +=
					'<button type="button" id="zbs_invoicing_send_email" class="ui button yellow">' +
					zbscrm_JS_invoice_lang( 'send_email' ) +
					'</button>';
			}
		}
	}

	//for the new invoice stuff (save down)
	if ( res.invoiceObj.new_invoice ) {
		html += '<input type="hidden" name="zbscrm_newinvoice" value="1" />';
	}

	html += '</div>';

	return html;
}

// central check + retrieve billto email
/**
 *
 */
function zbscrmJS_retrieveCurrentBillToEmail() {
	// email? (if assigned)
	var potentialEmail = jQuery( '#zbs_inv_bill' ).val();
	// if not set already, then get from this:
	if ( typeof potentialEmail === 'undefined' || ! zbscrm_JS_validateEmail( potentialEmail ) ) {
		// here we allow for prefilled data via zbsprefillcust _GET param (passed by php)
		var billTo = window.zbs_invoice.invoiceObj.bill;
		if (
			( billTo == null || billTo == '' ) &&
			typeof window.zbsJS_prefillemail !== 'undefined' &&
			typeof window.zbsJS_prefillid !== 'undefined'
		) {
			// prefill - contact/company email
			billTo = window.zbsJS_prefillemail;
		}

		potentialEmail = billTo;
	}

	return potentialEmail;
}

/**
 * @param res
 */
function zbscrm_JS_draw_invoice_logo_html( res ) {
	var html = '',
		hide = '',
		show = '';

	if ( res.invoiceObj.logo_url != '' ) {
		hide = 'hide';
		show = 'show';
	}

	html = '<div id="zbs_invoice_logos">';
	html += '<div class="wh-logo ' + hide + '">';
	html +=
		'<i class="fa fa-file-image-o" aria-hidden="true"></i><span class="wh-logo-text">+ ' +
		zbscrm_JS_invoice_lang( 'add_logo' ) +
		'</span>';
	html += '</div>';
	html += '<div class="wh-logo-set ' + show + '">';
	html += '<img id="wh-logo-set-img" src="' + jpcrm.esc_attr( res.invoiceObj.logo_url ) + '" />';
	html +=
		'<input type="hidden" name="zbsi_logo" id="logo" value="' +
		jpcrm.esc_attr( res.invoiceObj.logo_url ) +
		'" />';
	html += '<div class="zbs-logo-options">';
	html += '<span class="zbs-update">' + zbscrm_JS_invoice_lang( 'update' ) + '</span>';
	html += '<span class="zbs-remove"> ' + zbscrm_JS_invoice_lang( 'remove' ) + '</span>';
	html += '</div>';
	html += '</div>';
	html += '</div>';

	return html;
}

/**
 * @param res
 */
function zbscrm_JS_draw_invoice_top_right_form( res ) {
	html = '';
	html += '<div class="zbs-invoice-topper">';
	html += '<table class="form-table">';

	//invoice number :-) will be auto-incrementing version from DB table. option to hide
	//if (res.invoiceObj.settings.invid){
	if ( res.invoiceObj.settings.hideid != '1' ) {
		// Use id + id_override fields only, v3+
		var potentialInvID = '';
		var zbsID = -1;
		if ( typeof res.invoiceObj.id !== 'undefined' ) {
			potentialInvID = res.invoiceObj.id;
			zbsID = res.invoiceObj.id;
		}

		// if -1, for now just hide it (until reloads with actual id from db)
		if ( potentialInvID == -1 ) {
			// silent
			html += '<tr class="hide"><th></th><td>';

			html += '<input type="hidden" name="zbsinvid" value="' + zbsID + '" />';

			html += '</td></tr>';
		} else {
			// show
			html +=
				'<tr class="wh-large zbs-invoice-number"><th><label for="no">' +
				zbscrm_JS_invoice_lang( 'invoice_number' ) +
				':</label></th>';
			html += '<td>';

			html += '<span class="zbs-inv-no">' + potentialInvID + '</span>';
			html += '<input type="hidden" name="zbsinvid" value="' + zbsID + '" />';

			html += '</td>';
			html += '</tr>';
		}
	}

	//invoice date :-) date picker. Can we fix this for good in here now? formating etc?
	html +=
		'<tr class="wh-large"><th><label for="date">' +
		zbscrm_JS_invoice_lang( 'invoice_date' ) +
		':</label></th>';
	html += '<td>';
	html +=
		'<input type="date" name="zbsi_date" placeholder="yyyy-mm-dd" value="' +
		res.invoiceObj.date_date +
		'" />';
	html += '</td>';
	html += '</tr>';

	//reference
	html += '<tr class="wh-large">';
	html += '<th><label for="ref">' + zbscrm_JS_invoice_lang( 'reference' ) + ':</label></th>';
	html += '<td>';
	if ( 'reftype' in res.invoiceObj.settings && res.invoiceObj.settings.reftype === 'autonumber' ) {
		if ( res.invoiceObj.status === 'draft' ) {
			prefix = res.invoiceObj.settings.refprefix;
			next_number = res.invoiceObj.settings.refnextnum;
			suffix = res.invoiceObj.settings.refsuffix;

			is_first_invoice = res.invoiceObj.settings.isfirstinv;

			html +=
				'<span style="color:grey" title="' +
				zbscrm_JS_invoice_lang( 'nextref' ) +
				'">' +
				zbscrm_JS_invoice_lang( 'autogenerated' ) +
				': ' +
				prefix +
				next_number +
				suffix +
				'</span>';
			if ( is_first_invoice && prefix === '' && suffix === '' ) {
				html +=
					'<br><a href="' +
					res.invoiceObj.settings.settings_slug +
					'"> ' +
					zbscrm_JS_invoice_lang( 'refsettings' ) +
					'</a>';
			}
		} else {
			html += '<span class="zbs-inv-ref">' + res.invoiceObj.id_override + '</span>';
		}
	} else {
		html +=
			'<input type="text" name="zbsi_ref" id="ref" class="form-control widetext" placeholder="" value="' +
			jpcrm.esc_attr( res.invoiceObj.id_override ) +
			'" autocomplete="zbsinv" />';
	}
	html += '</td>';
	html += '</tr>';

	//due date - we do not have any functionality on the back of the due date. A nice to have would be send reminders "X" days before
	//for that though - will need to be done in Automations etc.

	// WH notes:
	// because our initial model just stores due_date, this now switches:
	// ... if due_date not set, editor will keep showing "due in x days" select
	// ... once set, that'll always show as a datepicker, based on the UTS in due_date

	if (
		typeof res.invoiceObj.due_date !== 'undefined' &&
		res.invoiceObj.due_date != null &&
		res.invoiceObj.due_date != 0
	) {
		// due on date <datepicker>
		html +=
			'<tr class="wh-large"><th><label for="due_date">' +
			zbscrm_JS_invoice_lang( 'due_date' ) +
			':</label></th>';
		html += '<td>';
		html +=
			'<input type="date" name="zbsi_due_date" placeholder="yyyy-mm-dd" value="' +
			res.invoiceObj.due_date_date +
			'" />';
		html += '</td>';
		html += '</tr>';
	} else {
		// due in x days <select>

		html += '<tr class="wh-large">';
		html += '<th><label for="due">' + zbscrm_JS_invoice_lang( 'due_date' ) + ':</label></th>';
		html += '<td>';
		html +=
			'<select id="zbsinv_due_days" name="zbsi_due" class="form-control" style="font-size:16px;">';
		html += '<option value = "-1">' + zbscrm_JS_invoice_lang( 'due', '', 'none' ) + '</option>';
		html += '<option value = "0">' + zbscrm_JS_invoice_lang( 'due', '', 'on' ) + '</option>';
		html += '<option value = "10">' + zbscrm_JS_invoice_lang( 'due', '', 'ten' ) + '</option>';
		html += '<option value = "15">' + zbscrm_JS_invoice_lang( 'due', '', 'fifteen' ) + '</option>';
		html += '<option value = "30">' + zbscrm_JS_invoice_lang( 'due', '', 'thirty' ) + '</option>';
		html +=
			'<option value = "45">' + zbscrm_JS_invoice_lang( 'due', '', 'fortyfive' ) + '</option>';
		html += '<option value = "60">' + zbscrm_JS_invoice_lang( 'due', '', 'sixty' ) + '</option>';
		html += '<option value = "90">' + zbscrm_JS_invoice_lang( 'due', '', 'ninety' ) + '</option>';
		html += '</select>';
		html += '</td>';
		html += '</tr>';
	}

	// if inv pro, allow additions here
	if ( typeof window.zbscrm_JS_draw_invoice_pro_top_right === 'function' ) {
		// use it
		html += zbscrm_JS_draw_invoice_pro_top_right( res.invoiceObj );
	}

	// custom fields
	if (
		typeof window.zbscrmjs_invoice_custom_fields !== 'undefined' &&
		window.zbscrmjs_invoice_custom_fields.length > 0
	) {
		/* ... started this way, but actually, just use the php to generate :) + copy in a layer up (after drawing html so can inject)
				jQuery.each(window.zbscrmjs_invoice_custom_fields,function(customFieldKey,customField){

					html += '<tr class="wh-large">';
					html += '<th><label for="' + customFieldKey + '">' + customField[1] + ':</label></th>';
						html += '<td>';
							//html += '<input type="text" name="zbsi_' + customFieldKey + '" id="' + customFieldKey + '" class="form-control widetext" placeholder="" value="' + res.invoiceObj.id_override + '" autocomplete="zbsinv" />';

						html += '</td>';
		            html += '</tr>';

				});
				*/
	}

	html += '</table></div>';
	html += '<div class="clear"></div>';

	return html;
}

//the new type-ahead function here. Gets ID based on NAME or EMAIL search of Contacts AND Companies.
/**
 * @param res
 */
function zbscrm_JS_draw_send_invoice_to( res ) {
	var zbs_invoice_contact = res.invoiceObj.invoice_contact;
	var zbs_invoice_company = res.invoiceObj.invoice_company;

	// at some point we changed these to be passing the full obj
	// ... if so, interpret
	if (
		typeof window.zbs_invoice.invoiceObj.invoice_contact === 'object' &&
		typeof window.zbs_invoice.invoiceObj.invoice_contact.id !== 'undefined'
	) {
		zbs_invoice_contact = parseInt( window.zbs_invoice.invoiceObj.invoice_contact.id );
	}
	if (
		typeof window.zbs_invoice.invoiceObj.invoice_company === 'object' &&
		typeof window.zbs_invoice.invoiceObj.invoice_company.id !== 'undefined'
	) {
		zbs_invoice_company = parseInt( window.zbs_invoice.invoiceObj.invoice_company.id );
	}

	// here we allow for prefilled data via zbsprefillcust _GET param (passed by php)
	var billTo = res.invoiceObj.bill_name;
	if (
		( billTo == null || billTo == '' ) &&
		typeof window.zbsJS_prefillemail !== 'undefined' &&
		typeof window.zbsJS_prefillid !== 'undefined'
	) {
		// prefill - contact/company email
		billTo = window.zbsJS_prefillname;

		// depending on type, also override (Empty) zbs_invoice_contact or zbs_invoice_company
		if ( typeof window.zbsJS_prefillobjtype !== 'undefined' ) {
			if ( window.zbsJS_prefillobjtype == 1 && zbs_invoice_contact == -1 ) {
				zbs_invoice_contact = parseInt( window.zbsJS_prefillid );
			}
			if ( window.zbsJS_prefillobjtype == 2 && zbs_invoice_company == -1 ) {
				zbs_invoice_company = parseInt( window.zbsJS_prefillid );
			}

			// catch any mishaps
			if ( zbs_invoice_contact <= 0 ) {
				zbs_invoice_contact = -1;
			}
			if ( zbs_invoice_company <= 0 ) {
				zbs_invoice_company = -1;
			}
		}
	}
	//console.log('billto:',billTo); //prefillid

	var html = '';
	html += '<div id="billing-to">';

	html += '<div class="billing-to-title">';
	html +=
		'<i class="linkify icon"></i> <span class="your-info-biz">' +
		zbscrm_JS_invoice_lang( 'send_to' ) +
		'</span>';
	html += '</div>';

	html += '<div class="form-table">';
	//html += '<div class="inv-to-form">' + zbscrm_JS_invoice_lang('send_to') +':</div>';
	html += '<div class="wh-large inv-to-input">';
	html += '<div class="zbs-type-ahead-invoice">';
	html +=
		'<input class="form-control typeahead" type="text" id="zbs_inv_bill" name="zbscq_bill" value="' +
		billTo +
		'" placeholder="' +
		zbscrm_JS_invoice_lang( 'bill_to' ) +
		'" />';
	html += '</div>';
	html +=
		'<div class="edit-c"><a class="zbs-edit-assign-to" href="#">' +
		zbscrm_JS_invoice_lang( 'edit_record' ) +
		'</a></div>';
	html += '</div>';
	html += '</div>';
	html += '</div>';
	html += '<div class="clear"></div>';

	//pass the contact ID and company ID hidden fields below (to be stored). Bloodhound will update these two fields
	//upon the UI completion of the above form field (id = zbs_inv_bill)
	html +=
		'<input type="hidden" id="zbs_invoice_contact" name="zbs_invoice_contact" value="' +
		zbs_invoice_contact +
		'" />';
	html +=
		'<input type="hidden" id="zbs_invoice_company" name="zbs_invoice_company" value="' +
		zbs_invoice_company +
		'" />';

	return html;
}

//customise invoice (i.e. hours or quantity)
/**
 * @param res
 */
function zbscrm_JS_draw_customise( res ) {
	html = '';

	html += '<div id="zbs-invoice-customiser">';
	html += '<div class="ui grid" style="margin: 0em 0.5em;">';
	html += '<div class="eight wide column" style="padding:0">';
	html +=
		'<span class="header" style="float:left;">' + zbscrm_JS_invoice_lang( 'customise' ) + '</span>';
	html +=
		'<select class="form-control" id="invoice-customiser-type" name="invoice-customiser-type" id="invoice-customiser-type" style="width:30%;">';
	html += '<option value="quantity"';
	if ( res.invoiceObj.invoice_hours_or_quantity == 'quantity' ) {
		html += ' selected="selected"';
	}
	html += '>' + zbscrm_JS_invoice_lang( 'quantity' ) + '</option>';
	html += '<option value="hours"';
	if ( res.invoiceObj.invoice_hours_or_quantity == 'hours' ) {
		html += ' selected="selected"';
	}
	html += '>' + zbscrm_JS_invoice_lang( 'hours' ) + '</option>';
	html += '</select>';
	html += '</div>';

	html += '</div>';
	html += '</div>';
	html += '<div class="clear"></div>';

	return html;
}

//the business info section
/**
 * @param res
 */
function zbscrm_JS_draw_invoice_biz_info( res ) {
	html = '';
	html += '<div id="zbs-business-info-wrapper">';
	html += '<div class="business-info-toggle">';
	html +=
		'<i class="fa fa-chevron-circle-right" aria-hidden="true"></i> <span class="your-info-biz">' +
		zbscrm_JS_invoice_lang( 'biz_info' ) +
		'</span>';
	html += '</div>';

	html += '<div class="business-info">';
	html += '<table class="table zbs-table">';
	html += '<tbody>';
	html += '<tr><td>' + res.invoiceObj.settings.bizname + '</td></tr>';
	html += '<tr><td>' + res.invoiceObj.settings.yourname + '</td></tr>';
	html += '<tr><td>' + res.invoiceObj.settings.businessextra + '</td></tr>';
	html += '<tr class="top-pad"><td>' + res.invoiceObj.settings.businessyouremail + '</td></tr>';
	html += '<tr><td>' + res.invoiceObj.settings.businessyoururl + '</td></tr>';
	html += '</tbody>';
	html += '</table>';
	html +=
		'<span class="edit-or-add"><a href="' +
		res.invoiceObj.settings.biz_settings_slug +
		'" target="_blank">' +
		zbscrm_JS_invoice_lang( 'add_edit' ) +
		'</a></span>';
	html += '</div>';
	html += '</div>';

	return html;
}

//the line items
/**
 * @param res
 */
function zbscrm_JS_draw_line_items( res ) {
	window.zbs_invoice_rownum = 1;
	//window.zbsremoverow = zbscrm_JS_invoice_lang('remove_row');

	var html = '';

	// space for extension
	if ( typeof window.zbscrm_JS_draw_invoiceCustomiserExtras === 'function' ) {
		html += '<div class="clear" style="position:relative;margin:10px;height:40px">';
		html += zbscrm_JS_draw_invoiceCustomiserExtras( res );
		html += '</div>';
	}

	html += '<div id="zbs-invoice-items">';
	html += '<table class="table">';
	html += '<thead>';
	html += '<th>' + zbscrm_JS_invoice_lang( 'description' ) + '</th>';
	if ( res.invoiceObj.invoice_hours_or_quantity == 'quantity' ) {
		html += '<th class="cen" id="zbs_inv_qoh">' + zbscrm_JS_invoice_lang( 'quantity' ) + '</th>';
		html += '<th class="cen" id = "zbs_inv_por" >' + zbscrm_JS_invoice_lang( 'price' ) + '</th>';
	} else {
		html += '<th class="cen" id="zbs_inv_qoh">' + zbscrm_JS_invoice_lang( 'hours' ) + '</th>';
		html += '<th class="cen" id="zbs_inv_por">' + zbscrm_JS_invoice_lang( 'rate' ) + '</th>';
	}
	if ( res.invoiceObj.settings.invtax == 1 ) {
		html += '<th class="cen taxhide">' + zbscrm_JS_invoice_lang( 'tax' ) + '</th>';
	}
	html += '<th>' + zbscrm_JS_invoice_lang( 'amount' ) + '</th>';
	html += '</thead>';

	html += '<tbody class="zbs-invoice-line-items">';

	//the invoice items themselves. drawn with JS. Can fix up proper tax select here too (padding zbs_invoice_rownum) to this line.
	rowhtml = '';
	if ( res.invoiceObj.invoice_items == '' ) {
		//this is if we have no ivoice items set.
		i = 1;
		var line = {};

		//defaults
		/* Mike's original
				line.zbsli_itemname 	= '';
				line.zbsli_des 		= '';
				line.zbsli_quan 		= 1;
				line.zbsli_price 		= 0;
				line.zbsli_tax 		= 0; //no tax
				DAL3:*/
		line.title = '';
		line.desc = '';
		line.quantity = 1; // default 1
		line.price = 0;
		line.rate = 0; //no tax

		//output an empty row.
		rowhtml += zbscrm_JS_generate_invoice_row( res, i, line );
	} else {
		//if there is data. draw the lines here. Can tidy the above a bit first. Is messy. Inline style, etc.
		jQuery.each( res.invoiceObj.invoice_items, function ( i, line ) {
			//console.log(line);

			//make the UI output simple! We are storing
			/*
						item_name:               zbsli_itemname
						item_description:        zbsli_des
						quantity (label hours):  zbsli_quan
						price  (label rate):     zbsli_price
						tax:                     zbsli_tax       [MIGRATE TO TAX TABLE]
						row_total: 				 zbsli_rowt       price * quantity
					*/
			//the invoice row
			rowhtml += zbscrm_JS_generate_invoice_row( res, window.zbs_invoice_rownum, line );
		} );
	}

	html += rowhtml;

	html += '</tbody>';
	html += '</table>';

	//the add new row UI.
	html +=
		'<div id="zbs-add-new-row"><i class="plus circle icon"></i>' +
		zbscrm_JS_invoice_lang( 'add_row' ) +
		'</div>';

	html += '</div>';

	return html;
}

//the totals table
/**
 * @param res
 */
function zbscrm_JS_draw_invoice_totals( res ) {
	//totals (and line totals) now to be calculated via the JS (and PHP) and not needed to be stored in meta

	var html = '';
	html += '<div class="invoice-grand-total-wrapper ui grid">';

	html += '<div class="col-md-6 eight wide column"></div>';

	html += '<div class="col-md-6 inv-totals eight wide column">';

	//subtotal
	html += '<div class="total-row">';
	html += '<div class="zlabel half">' + zbscrm_JS_invoice_lang( 'subtotal' ) + '</div>';
	html += '<div class="calc-value half ri" id="subtotal-value"></div>';
	html += '</div>';

	//discount
	if ( res.invoiceObj.settings.invdis == 1 ) {
		html += '<div class="total-row">';
		html += '<div class="zlabel one-four">' + zbscrm_JS_invoice_lang( 'discount' ) + '</div>';
		html += "<div class='two-four invoice-discount-total'>";
		html +=
			'<input class = "form-control half" type="number" name="invoice_discount_total" id="invoice_discount_total" step="0.01" min="0" value="' +
			res.invoiceObj.totals.invoice_discount_total +
			'">';
		if ( res.invoiceObj.totals.invoice_discount_type == 'm' ) {
			html +=
				'<select id="invoice_discount_type" name="invoice_discount_type" class="form-control half"><option value="%" >%</option><option value="m" selected>' +
				zbscrm_JS_invoice_lang( 'amount' ) +
				'</option></select>';
		} else {
			html +=
				'<select id="invoice_discount_type" name="invoice_discount_type" class="form-control half"><option value="%">%</option><option value="m">' +
				zbscrm_JS_invoice_lang( 'amount' ) +
				'</option></select>';
		}
		html += '</div>';
		html += '<div id="discount-value" class = "one-four ri">0</div>';
		html += '</div>';
	}

	//shipping
	if ( res.invoiceObj.settings.invpandp == 1 ) {
		html += '<div class="total-row pbot30">';
		html += '<div class="zlabel half">' + zbscrm_JS_invoice_lang( 'shipping' ) + '</div>';
		html +=
			'<input class="zbs_gt zbsli_price-1 half ri topmm5" type="number" step="0.01" min="0" name="invoice_postage_total" id="invoice_postage_total" value="' +
			res.invoiceObj.totals.invoice_postage_total +
			'">';
		html += '</div>';
	}

	shipping = res.invoiceObj.totals;
	//this will be the setting for what tax rate to apply to shipping (not stored (yet) in the data)
	shipping.taxes = res.invoiceObj.shipping_taxes;

	if ( res.invoiceObj.settings.invpandp == 1 && res.invoiceObj.settings.invtax == 1 ) {
		//tax on shipping (select)
		html += '<div class="total-row pbot30">';
		html += '<div class="zlabel half">' + zbscrm_JS_invoice_lang( 'tax_on_shipping' ) + '</div>';
		html +=
			'<div class="half ri topmm10">' + zbscrm_JS_output_tax_line( res, -1, shipping ) + '</div>';
		html += '</div>';
	}

	//tax table
	html += '<div class="total-row-wrap" id="tax-total-block">';
	html += '</div>';

	//grand total fill with JS from line items
	html += '<div class="total-row grand-total">';
	html += '<div class="zlabel half">' + zbscrm_JS_invoice_lang( 'total' ) + '</div>';
	html += '<div class="calc-value half ri zbs-heavy" id="zbs-inv-grand-total"></div>';
	// #TEMPNEEDSPHPFUNC (search for this hash for other refs to remove)
	// TEMP: WH added for MS on DAL3 work,
	// ... this dumps the total into an inp for saving
	// SHOULD BE REPLACED with php variant of js total calc code here, later
	// ... smt like zeroBSCRM_invoicing_calcTotal($inv);
	html +=
		'<input type="hidden" name="zbs-inv-grand-total-store" id="zbs-inv-grand-total-store" value="0" />';
	html += '</div>';

	html += '</div>';

	html += '</div>';

	return html;
}

/**
 * @param res
 */
function zbscrm_JS_draw_partials_table( res ) {
	var html = '<div id="zbs-invoice-partial-payments" class = "ui grid">';

	html += '<div class="col-md-6 eight wide column"></div>';
	var paid_to_date = 0;
	html += '<div class="col-md-6 eight wide column">';
	window.invoice_partial = false;
	jQuery.each( res.invoiceObj.partials, function ( i, v ) {
		var vValue = '';

		// debug console.log(v);
		if ( i == 0 ) {
			//first row
			html +=
				'<div class="partial-row-tab">' + zbscrm_JS_invoice_lang( 'partial_table' ) + '</div>';
		}
		html += '<div class="partial-row">';

		var vTypeStr = ''; // if != 'sale' this'll add type
		var vFailStr = ''; // if it's not 'succeeded' status will add
		if (
			typeof v.type !== 'undefined' &&
			typeof v.type_accounting !== 'undefined' &&
			v.type_accounting == 'credit'
		) {
			vTypeStr = ' (' + v.type + ')';
		}
		var vSymbolStart = '',
			vSymbolEnd = ''; // this gets set to () if is a creditnote/refund transaction
		if ( typeof v.type_accounting !== 'undefined' && v.type_accounting == 'credit' ) {
			vSymbolStart = '(';
			vSymbolEnd = ')';
		}

		// value line
		var partial_total_value = v.total;
		vValue = vSymbolStart + v.total + vSymbolEnd;

		// failed trans ignore...
		var vStatus = zbscrm_JS_invoice_lang( 'incomplete', 'Incomplete' );
		if ( typeof v.status !== 'undefined' ) {
			vStatus = v.status;
		}

		if ( typeof v.status_bool !== 'undefined' && v.status_bool != 1 ) {
			vFailStr += '<br />(' + vValue + ' - ' + vStatus + ')';
			// clear value
			vValue = '0.0';
			partial_total_value = '0.0';
		}
		var link = zbscrm_JS_transaction_edit_URL( v.id );

		html +=
			'<div class="zlabel half"><a href="' +
			link +
			'" target="_blank">' +
			v.ref +
			vTypeStr +
			'</a>' +
			vFailStr +
			'</div>';
		html +=
			'<div class="zbs-partial-value half ri">' +
			parseFloat( partial_total_value ).toFixed( zbs_root.currencyOptions.noOfDecimals ) +
			'</div>';
		html += '</div>';
		window.invoice_partial = true;
	} );

	//amount due
	if ( window.invoice_partial ) {
		html += '<div id="amount-due" class="due-row">';
		html +=
			'<div class="amt-due-label zlabel half">' + zbscrm_JS_invoice_lang( 'amount_due' ) + '</div>';
		html += '<div class="amt-due-amt half ri" id="inv-amount-due"></div>';
		html += '</div>';
	}

	//WHADDED - seems you were missing one here? / col
	html += '</div>'; //end col

	html += '</div>'; //end partial table

	return html;
}

//i is the count, v is the values of the row
/**
 * @param res
 * @param i
 * @param v
 */
function zbscrm_JS_generate_invoice_row( res, i, v ) {
	//console.log('drawing:',v);

	var rowhtml =
		'<tr class="zbs-invoice-row zbs-item-block zbs-rowid' + i + '" data-rowid="' + i + '">';
	//title test
	if ( v.title == null ) {
		item_title = '';
	} else {
		item_title = v.title;
	}

	//description test
	if ( v.desc == null ) {
		item_description = '';
	} else {
		item_description = v.desc;
	}

	rowhtml += '<td class="first">';
	rowhtml +=
		'<input class="form-control zbs-item-name" type="text" name = "zbsli_itemname[]" value = "' +
		item_title +
		'" placeholder="' +
		zbscrm_JS_invoice_lang( 'rowtitleplaceholder' ) +
		'" /><br/>';
	rowhtml +=
		'<textarea class="form-control" name = "zbsli_itemdes[]" placeholder="' +
		zbscrm_JS_invoice_lang( 'rowdescplaceholder' ) +
		'">' +
		item_description +
		'</textarea>';
	rowhtml += '</td>';

	//quantity column
	rowhtml += '<td class="second">';
	rowhtml +=
		'<input type="number" class="zbsli_quan zbsli_quan' +
		i +
		' form-control quan" data-zbsr="' +
		i +
		'" name = "zbsli_quan[]" value = "' +
		v.quantity +
		'" min="0">';
	rowhtml += '</td>';

	//price column
	rowhtml += '<td class="third">';
	rowhtml +=
		'<input type="number" class="zbsli_price zbsli_price' +
		i +
		' form-controm price" data-zbsr="' +
		i +
		'" name = "zbsli_price[]" value = "' +
		v.price +
		'" step="0.01">';
	rowhtml += '</td>';

	//tax column
	if ( res.invoiceObj.settings.invtax == 1 ) {
		rowhtml += '<td class="forth">';
		rowhtml += zbscrm_JS_output_tax_line( res, i, v );
		rowhtml += '</td>';
	}
	//amount column
	rowhtml += '<td class="fifth row-amount row-amount-' + i + '">';
	rowhtml += '</td>';

	//remove row column (only after first row)
	rowhtml +=
		'<td><div class="remove-row" data-rowid="' +
		i +
		'"><i class="times circle icon"></i></div></td>';

	rowhtml += '</tr>';

	//increment
	window.zbs_invoice_rownum++;

	return rowhtml;
}

//as described, this outputs the tax select box (single select). Multi-Select was a bit confusing for me to THEN calcualte the totals table for tax.
/**
 * @param res
 * @param i
 * @param v
 */
function zbscrm_JS_output_tax_line( res, i, v ) {
	// debug  console.log('tax',v); //taxes

	var tax_id;

	if ( typeof v.taxes === 'undefined' || v.taxes == null ) {
		tax_id = 0;
	} else {
		tax_id = parseInt( v.taxes ); // fine while we have 1 tax, if multi-select on tax, this'll be a CSV, e.g. "130,132"
	}

	if ( i == -1 ) {
		taxhtml =
			'<select name="zbsli_tax_ship" class="tax-select tax-select' +
			i +
			' form-control" data-zbsr="' +
			i +
			'">';
	} else {
		taxhtml =
			'<select name="zbsli_tax[]" class="tax-select tax-select' +
			i +
			' form-control" data-zbsr="' +
			i +
			'">';
	}

	selected = '';
	if ( tax_id == 0 ) {
		selected = 'selected';
	}
	taxhtml +=
		'<option value="0" ' +
		selected +
		'>' +
		zbscrm_JS_invoice_lang( 'no_tax' ) +
		'</option><optgroup label="' +
		zbscrm_JS_invoice_lang( 'taxgrouplabel' ) +
		'">';
	jQuery.each( res.tax_linesObj, function ( j, t ) {
		if ( tax_id == t.id ) {
			selected = 'selected';
		} else {
			selected = '';
		}
		taxhtml +=
			'<option value="' + t.id + '" ' + selected + '>' + t.name + ' : ' + t.rate + '%</option>';
	} );
	taxhtml += '</optgroup>';
	taxhtml += '</select>';

	return taxhtml;
}

/**
 *
 */
function zbscrm_JS_add_empty_row() {
	var rowhtml = '';
	var v = {}; // super funky MS! var v = jQuery();

	//defaults
	/* Mike's original
	v.zbsli_itemname = '';
	v.zbsli_des = '';
	v.zbsli_quan = 1; // default 1
	v.zbsli_price = 0;
	v.zbsli_tax = 0; //no tax
	DAL3:*/
	v.title = '';
	v.desc = '';
	v.quantity = 1; // default 1
	v.price = 0;
	v.rate = 0; //no tax

	//output an empty row.
	rowhtml += zbscrm_JS_generate_invoice_row( window.zbs_invoice, window.zbs_invoice_rownum, v );

	jQuery( '.zbs-invoice-line-items' ).append( rowhtml );
	zbscrm_JS_bind_row_actions();
}

// ========================================================================
// ======= / Drawing/HTML Gen
// ========================================================================

// ========================================================================
// ======= Binds
// ========================================================================

// bind due days val from local obj
/**
 *
 */
function zbscrm_JS_bind_due_days() {
	if (
		typeof window.zbs_invoice !== 'undefined' &&
		typeof window.zbs_invoice.invoiceObj !== 'undefined' &&
		typeof window.zbs_invoice.invoiceObj.due !== 'undefined'
	) {
		jQuery( '#zbsinv_due_days' ).val( window.zbs_invoice.invoiceObj.due );
	}
}

/**
 *
 */
function zbscrm_JS_bind_row_actions() {
	// add empty row
	jQuery( '#zbs-add-new-row' )
		.off( 'click' )
		.on( 'click', function () {
			//simple function call now - add blocker?
			zbscrm_JS_add_empty_row( window.zbs_invoice );
		} );

	// remove a row.
	jQuery( '.remove-row' )
		.off( 'click' )
		.on( 'click', function ( e ) {
			var zbsremovevar = jQuery( this ).data( 'rowid' );

			/* rather than alert if first row, now deletes + re-adds blank

		if (zbsremovevar == 1){
			alert('You cannot remove the first row');
		} else {
			jQuery('.zbs-rowid' + zbsremovevar).remove();
			//calculate the invoice subtotal.
			zbscrm_JS_calcTotals();
		} */

			// delete
			jQuery( '.zbs-rowid' + zbsremovevar ).remove();

			// if empty (after html rerender), add blank
			setTimeout( function () {
				// add new
				if ( jQuery( '.zbs-invoice-row' ).length == 0 ) {
					zbscrm_JS_add_empty_row( window.zbs_invoice );
				}
			}, 0 );

			//calculate the invoice subtotal.
			zbscrm_JS_calcTotals();
		} );

	//if a number has changed (i.e. item or quantity.)
	jQuery( '.zbs-item-block input[type=number]' ).on( 'keyup mouseup', function () {
		var zbs_row_to_up = jQuery( this ).data( 'zbsr' );
		if ( jQuery( this ).hasClass( 'quan' ) ) {
			quan = jQuery( this ).val();
		}
		if ( jQuery( this ).hasClass( 'price' ) ) {
			price = jQuery( this ).val();
		}
		jQuery( this )
			.parent()
			.siblings()
			.find( 'input[type=number]' )
			.each( function ( index, value ) {
				if ( jQuery( value ).hasClass( 'quan' ) ) {
					quan = value.value;
				}
				if ( jQuery( value ).hasClass( 'price' ) ) {
					price = value.value;
				}
			} );
		row_tot = quan * price;
		jQuery( this )
			.parent()
			.siblings( '.row-amount-' + zbs_row_to_up )
			.html( row_tot.toFixed( zbs_root.currencyOptions.noOfDecimals ) );

		//calculate the invoice subtotal.
		zbscrm_JS_calcTotals();
	} );

	// tax change
	jQuery( '.tax-select' ).on( 'change', function () {
		var value = jQuery( this ).val();
		//calculate the invoice subtotal.
		zbscrm_JS_calcTotals();
	} );
}

//the subtotal calculation.
/**
 *
 */
function zbscrm_JS_calculate_invoice_row_subtotals() {
	jQuery( '.zbs-invoice-row' ).each( function ( index, pvalue ) {
		jQuery( pvalue )
			.children()
			.find( 'input[type=number]' )
			.each( function ( index, value ) {
				zbs_row_to_up = jQuery( this ).data( 'zbsr' );
				if ( jQuery( this ).hasClass( 'quan' ) ) {
					quan = jQuery( this ).val();
				}
				if ( jQuery( this ).hasClass( 'price' ) ) {
					price = jQuery( this ).val();
				}
			} );
		row_tot = quan * price;
		jQuery( '.row-amount-' + zbs_row_to_up ).html(
			row_tot.toFixed( zbs_root.currencyOptions.noOfDecimals )
		);

		zbscrm_JS_calculate_invoice_subtotal();
	} );
}

//calculate the subtotal cell
/**
 *
 */
function zbscrm_JS_calculate_invoice_subtotal() {
	var invoice_subtotal = 0;
	jQuery( '.row-amount' ).each( function ( ele, value ) {
		// this check is required to stop whole thing falling over
		var v = jQuery( this ).html();
		if ( v == '' ) {
			v = 0;
		}
		v = parseFloat( v );

		invoice_subtotal += v;
	} );

	jQuery( '#subtotal-value' ).html(
		invoice_subtotal.toFixed( zbs_root.currencyOptions.noOfDecimals )
	);
}

//output the tax amounts on the invoice
/**
 *
 */
function zbscrm_JS_calculate_invoice_tax_table() {
	var this_row_amount = [];
	var tax_percent = [];
	var this_shipping_tax = [];

	//zbscrm_JS_pickTaxRate instead: var tax_table_index = window.zbs_invoice.tax_linesObj;

	var total_amount = 0,
		this_tax_id = -1,
		this_row_index = -1;
	jQuery( '.tax-select' ).each( function ( index, value ) {
		this_tax_id = jQuery( this ).val();
		this_row_index = jQuery( this ).data( 'zbsr' );

		//console.log('TaxRate ' + this_tax_id + ' for row ' + this_row_index);

		if ( this_row_index == -1 ) {
			// row -1
			//the shipping tax is handled like this
			this_row_amount[ index ] = jQuery( '.zbsli_price' + this_row_index ).val();
			this_shipping_tax[ index ] = 1;
		} else {
			// line items
			var quantity = parseFloat( jQuery( '.zbsli_quan' + this_row_index ).val() );
			var val = parseFloat( jQuery( '.zbsli_price' + this_row_index ).val() );
			if ( isNaN( quantity ) || isNaN( val ) ) {
				this_row_amount[ index ] = 0;
			} else {
				this_row_amount[ index ] = quantity * val;
			}
			this_shipping_tax[ index ] = 0;
		}

		total_amount = total_amount + this_row_amount[ index ];

		if ( this_tax_id > 0 ) {
			this_tax_line_data = zbscrm_JS_pickTaxRate( this_tax_id ); //tax_table_index[this_tax_id];
			tax_percent[ index ] = this_tax_line_data.id;
		} else {
			tax_percent[ index ] = 0;
		}
	} );

	zbscrm_JS_calculate_tax_amounts( this_row_amount, tax_percent, this_shipping_tax );
	// jQuery('#tax-total-block').append(tax_table_html);
}

/**
 * @param id
 */
function zbscrm_JS_pickTaxRate( id ) {
	var ret = false;

	jQuery.each( window.zbs_invoice.tax_linesObj, function ( ind, ele ) {
		if ( typeof ele.id !== 'undefined' && ele.id == id ) {
			ret = ele;
		}
	} );

	return ret;
}

/**
 * @param this_row_amount
 * @param tax_percent
 * @param this_shipping_tax
 */
function zbscrm_JS_calculate_tax_amounts( this_row_amount, tax_percent, this_shipping_tax ) {
	//zbscrm_JS_pickTaxRate instead: var tax_table_index = window.zbs_invoice.tax_linesObj;
	var discount_amount = parseFloat( jQuery( '#discount-value' ).html() );
	if ( isNaN( discount_amount ) ) {
		discount_amount = 0;
	}
	total = parseFloat( jQuery( '#subtotal-value' ).html() );

	tax_amount = new Array();
	tax_id = new Array();
	tax_rate = new Array();

	if ( discount_amount > 0 && total !== 0 ) {
		discount_proportion = discount_amount / total;
	} else {
		discount_proportion = 0; //i.e. no discount applied
	}

	for ( var i = 0; i < this_row_amount.length; i++ ) {
		//shipping tax will not be impacted by the discount proportion
		if ( this_shipping_tax[ i ] === 1 || total === 0 ) {
			discount_proportion = 0;
		} else {
			discount_proportion = discount_amount / total;
		}
		if ( tax_percent[ i ] == 0 ) {
			//if tax_id = 0 then tax_amount is 0.
			tax_amount[ i ] = 0;
			tax_id[ i ] = 0;
		} else {
			var taxRateLine = zbscrm_JS_pickTaxRate( tax_percent[ i ] ); //tax_table_index[this_tax_id];
			var taxRate = parseFloat( taxRateLine.rate );
			tax_amount[ i ] = ( ( 1 - discount_proportion ) * this_row_amount[ i ] * taxRate ) / 100;
			tax_id[ i ] = tax_percent[ i ];
		}
	}

	//initialise as 0.
	var tax_table_output = new Object();
	for ( var i = 0; i < this_row_amount.length; i++ ) {
		tax_table_output[ tax_id[ i ] ] = 0;
	}

	for ( var i = 0; i < this_row_amount.length; i++ ) {
		//console.log(tax_id[i] + ' = ',[tax_table_output[tax_id[i]],tax_amount[i]]);
		tax_table_output[ tax_id[ i ] ] = tax_table_output[ tax_id[ i ] ] + tax_amount[ i ];
	}

	var tax_html = '';
	jQuery.each( tax_table_output, function ( i, v ) {
		if ( i > 0 ) {
			//console.log(tax_table_output[i]);
			var taxRate = zbscrm_JS_pickTaxRate( i ); //tax_table_index[this_tax_id];
			tax_html += '<div class="total-row row">';
			tax_html += '<div class="tax-name third zlabel">' + taxRate.name + '</div>';
			tax_html += '<div class="tax-rate third ri">(' + taxRate.rate + '%)</div>';
			tax_html +=
				'<div class="tax-amt zbs-total-tax third ri">' +
				tax_table_output[ i ].toFixed( zbs_root.currencyOptions.noOfDecimals ) +
				'</div>';
			tax_html += '</div>';
		}
	} );

	jQuery( '#tax-total-block' ).html( tax_html );
}

/**
 *
 */
function zbscrm_JS_calc_grandtotal() {
	var debugTotalling = false; // temp debug switch

	var zbs_gt_invoice_tot = 0;

	//step 1: the subtotal
	zbs_gt_invoice_tot = zbs_gt_invoice_tot + parseFloat( jQuery( '#subtotal-value' ).html() );
	if ( debugTotalling ) {
		console.log( '=========== Totals: ===========' );
	}
	if ( debugTotalling ) {
		console.log( 'Subtotal:' + zbs_gt_invoice_tot );
	}

	//step 2: subtract the discount
	if ( window.zbs_invoice.invoiceObj.settings.invdis == 1 ) {
		zbs_gt_invoice_tot = zbs_gt_invoice_tot - parseFloat( jQuery( '#discount-value' ).html() );
		if ( debugTotalling ) {
			console.log(
				'Discounted ' + parseFloat( jQuery( '#discount-value' ).html() ) + ': ' + zbs_gt_invoice_tot
			);
		}
	}

	//step 3: add shipping
	if ( window.zbs_invoice.invoiceObj.settings.invpandp == 1 ) {
		zbs_gt_invoice_tot =
			zbs_gt_invoice_tot + parseFloat( jQuery( '#invoice_postage_total' ).val() );
		if ( debugTotalling ) {
			console.log(
				'+Shipping ' +
					parseFloat( jQuery( '#invoice_postage_total' ).val() ) +
					': ' +
					zbs_gt_invoice_tot
			);
		}
	}

	//step 4: add tax
	if ( window.zbs_invoice.invoiceObj.settings.invtax == 1 ) {
		jQuery( '.zbs-total-tax' ).each( function ( i, v ) {
			var taxValue = parseFloat( jQuery( this ).html() );
			if ( ! isNaN( taxValue ) ) {
				zbs_gt_invoice_tot = zbs_gt_invoice_tot + taxValue;
			}

			if ( debugTotalling ) {
				console.log( '+TAX ' + parseFloat( jQuery( this ).html() ) + ': ' + zbs_gt_invoice_tot );
			}
		} );
	}

	if ( debugTotalling ) {
		console.log( 'TOTAL:' + zbs_gt_invoice_tot.toFixed( zbs_root.currencyOptions.noOfDecimals ) );
	}
	if ( debugTotalling ) {
		console.log( '=========== / Totals ==========' );
	}

	jQuery( '#zbs-inv-grand-total' ).html(
		zbs_gt_invoice_tot.toFixed( zbs_root.currencyOptions.noOfDecimals )
	);

	// #TEMPNEEDSPHPFUNC (search for this hash for other refs to remove)
	// TEMP: WH added for MS on DAL3 work,
	// ... this dumps the total into an inp for saving
	// SHOULD BE REPLACED with php variant of js total calc code here, later
	// ... smt like zeroBSCRM_invoicing_calcTotal($inv);
	jQuery( '#zbs-inv-grand-total-store' ).val(
		zbs_gt_invoice_tot.toFixed( zbs_root.currencyOptions.noOfDecimals )
	);

	zbscrm_JS_calc_amount_due();
}

/**
 *
 */
function zbscrm_JS_calc_amount_due() {
	if ( window.invoice_partial ) {
		amount_due = parseFloat( jQuery( '#zbs-inv-grand-total' ).html() );
		jQuery( '.partial-row' ).each( function ( index, ele ) {
			// orig
			//amount_due = amount_due - parseFloat(jQuery('.zbs-partial-value',this).html());

			// get
			var v = jQuery( '.zbs-partial-value', ele ).text();

			// detect +-
			var multiplier = 1; // gets turned to -1 if negotive ()

			// got -?
			if ( v.indexOf( '(' ) !== -1 ) {
				v = v.replace( '(', '' ).replace( ')', '' );
				multiplier = -1;
			}
			v = parseFloat( v ) * multiplier;

			// debug console.log('amount:',[jQuery('.zbs-partial-value',ele).text(),amount_due,v]);

			// do it :)
			amount_due -= v;
		} );

		jQuery( '#inv-amount-due' ).html( amount_due.toFixed( zbs_root.currencyOptions.noOfDecimals ) );
	}
}

/**
 *
 */
function zbscrm_JS_bind_change_actions() {
	//the select box on invoices mainlu
	jQuery( '#invoice-customiser-type' ).on( 'change', function () {
		if ( jQuery( this ).val() == 'hours' ) {
			jQuery( '#zbs_inv_qoh' ).html( 'Hours' );
			jQuery( '#zbs_inv_por' ).html( 'Rate' );
		} else {
			jQuery( '#zbs_inv_qoh' ).html( 'Quantity' );
			jQuery( '#zbs_inv_por' ).html( 'Price' );
		}
	} );

	jQuery( '#invoice_postage_total' ).on( 'change', function () {
		jQuery( '#pandptotal' ).html(
			window.zbs_root.currencyOptions.currencyStr +
				parseFloat( jQuery( this ).val() ).toFixed( zbs_root.currencyOptions.noOfDecimals )
		);
		// recalc
		zbscrm_JS_calcTotals();
	} );

	jQuery( '#invoice_discount_total, #invoice_discount_type' ).on( 'change', function () {
		// recalc
		zbscrm_JS_calcTotals();
	} );

	jQuery( '#invoice_postage_tax' ).on( 'keyup mouseup', function () {
		if ( jQuery( this ).val() != '' ) {
			// recalc
			zbscrm_JS_calcTotals();
		}
	} );
}

/**
 *
 */
function zbscrm_JS_calculatediscount() {
	// discount-value
	var zbs_discount_amt = jQuery( '#invoice_discount_total' ).val();
	var zbs_discount_type = jQuery( '#invoice_discount_type' ).val();
	if ( zbs_discount_amt != '' ) {
		if ( zbs_discount_type == 'm' ) {
			jQuery( '#invoice_discount_total_value' ).val(
				parseFloat( zbs_discount_amt ).toFixed( zbs_root.currencyOptions.noOfDecimals )
			);
			jQuery( '#discount-value' ).html(
				parseFloat( zbs_discount_amt ).toFixed( zbs_root.currencyOptions.noOfDecimals )
			);
		} else {
			var zbs_discount_combi =
				( parseFloat( jQuery( '#subtotal-value' ).html() ) * zbs_discount_amt ) / 100;
			jQuery( '#invoice_discount_total_value' ).val(
				parseFloat( zbs_discount_combi ).toFixed( zbs_root.currencyOptions.noOfDecimals )
			);
			jQuery( '#discount-value' ).html(
				parseFloat( zbs_discount_combi ).toFixed( zbs_root.currencyOptions.noOfDecimals )
			);
		}
	}
}

// typeAHEAD for both (contact and company)
/**
 *
 */
function zbscrm_JS_invoice_typeahead_bind() {
	// endpoint - pass nonce this was as before send wasn't working weirdly in Bloodhound.
	endpoint = wpApiSettings.root + 'zbscrm/v1/concom?_wpnonce=' + wpApiSettings.nonce;

	var zbsInvoiceTo = new Bloodhound( {
		datumTokenizer: function ( d ) {
			return Bloodhound.tokenizers.whitespace( d.name_email );
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		prefetch: {
			url: endpoint,
			ttl: 300000, // 60000 = 1m, 300000 = 5 mins, 86400000 = 1 day (default) - ms
			ajax: {
				type: 'POST',
				cache: false,
				data: {
					id: -1,
					obj_type: -1,
				},
				complete: function ( jqXHR, textStatus ) {
					zbsInvoiceTo.clearRemoteCache();
				},
			},
		},
		remote: {
			// this checks when users type, via ajax search ... useful addition to (cached) prefetch
			url: wpApiSettings.root + 'zbscrm/v1/concom?_wpnonce=' + wpApiSettings.nonce + '&s=%QUERY',
			wildcard: '%QUERY',
		},
	} );

	//sets the company and contact ID on the UI (for later storage)
	var select = function ( e, datum, dataset ) {
		// show zbs_invoicing_send_email if legit.
		// in fact, these always return id, because 'select' doesn't catch empties.
		// ... see 'change' below :)
		jQuery( '#zbs_invoicing_send_email' ).hide();
		if ( typeof datum.id !== 'undefined' && datum.id !== null && datum.id !== '' ) {
			var potentialEmail = zbscrmJS_retrieveCurrentBillToEmail();
			if (
				typeof potentialEmail !== 'undefined' &&
				potentialEmail != '' &&
				zbscrm_JS_validateEmail( potentialEmail )
			) {
				// then show
				jQuery( '#zbs_invoicing_send_email' ).show();
			}
		}

		// normal setting:
		if ( datum.obj_type == 1 ) {
			jQuery( '#zbs_invoice_contact' ).val( datum.id );
			jQuery( '#zbs_invoice_company' ).val( -1 );

			// show hide learn menu links
			zeroBSCRMJS_showContactLinkIf( datum.id );
			zeroBSCRMJS_showCompanyLinkIf( -1 );
		} else if ( datum.obj_type == 2 ) {
			jQuery( '#zbs_invoice_company' ).val( datum.id );
			jQuery( '#zbs_invoice_contact' ).val( -1 );

			// show hide learn menu links
			zeroBSCRMJS_showContactLinkIf( -1 );
			zeroBSCRMJS_showCompanyLinkIf( datum.id );
		}
	};

	// Catches changes to bill to. Ultimately 'select' above deals with setting, and this with unsetting.
	var change = function ( e, datum, dataset ) {
		// show zbs_invoicing_send_email if legit.
		// in fact, these always return id, because 'select' doesn't catch empties.
		// ... see 'change' below :)
		jQuery( '#zbs_invoicing_send_email' ).hide();
		if ( typeof datum.id !== 'undefined' && datum.id !== null && datum.id !== '' ) {
			var potentialEmail = zbscrmJS_retrieveCurrentBillToEmail();
			if (
				typeof potentialEmail !== 'undefined' &&
				potentialEmail != '' &&
				zbscrm_JS_validateEmail( potentialEmail )
			) {
				// then show
				jQuery( '#zbs_invoicing_send_email' ).show();
			}
		} else if ( jQuery( '#zbs_inv_bill' ).val() == '' ) {
			jQuery( '#zbs_invoice_contact' ).val( -1 );
			jQuery( '#zbs_invoice_company' ).val( -1 );
			zeroBSCRMJS_showContactLinkIf( -1 );
			zeroBSCRMJS_showCompanyLinkIf( -1 );
		}
	};

	zbsInvoiceTo.initialize();

	// #WHTODO
	//WH this works, but left as is because needs to tie in with DB better (couldn't get it to type ahead properly (note its still neslekler name. This was in a guide I followed. Wary of breaking it if I just change that))
	//can tidy it up for me please? once it's working with the DB3.0 type-ahead? See that this gives a single box (address to which loads BOTH company or contact and can search on email or name) so super slick and should be our
	//only real usage of it (unless we *just* want to assign to a company (i.e. contact view)) but if assigning other objects this gives the option of both in the search box.
	jQuery( '#billing-to .typeahead' )
		.typeahead(
			{
				minLength: 1,
				highlight: true,
				hint: true,
			},
			{
				name: 'customers_and_companies',
				displayKey: 'name_email',
				display: function ( r ) {
					if ( r.name.trim() ) {
						return r.name;
					}
					//company name is required, so will always return this
					else if ( r.email ) {
						return r.email;
					}
					return 'Contact #' + r.id;
				},
				source: zbsInvoiceTo.ttAdapter(),
				limit: 10,
				templates: {
					suggestion: function ( r ) {
						ico = r.obj_type == 2 ? '<i class="building icon"></i>' : '<i class="user icon"></i>';
						var name = r.name.trim()
							? r.name
							: zeroBSCRMJS_globViewLang( 'contact' ) + ' #' + r.id;
						var email = r.email ? r.email : '<i>' + zbscrm_JS_invoice_lang( 'noemail' ) + '</i>';
						sug =
							'<div class="sug-wrap"><div class="ico">' +
							ico +
							'</div><div class="inner"><div class="name">' +
							name +
							'</div><div class="email">' +
							email +
							'</div></div><div class="clear"</div></div>';
						return sug;
					},
					empty: function ( v ) {
						//to do - link this to the add new customer (if B2B mode should also show link to add new Company too? hmmm WH thoughts? (needs translating too)
						var str =
							'<a href="' +
							window.zbs_invoice.invoiceObj.settings.addnewcontacturl +
							'" target="_blank">' +
							zbscrm_JS_invoice_lang( 'addnewcontact' ) +
							'</a>';
						if ( window.zbs_invoice.invoiceObj.settings.b2bmode ) {
							str += ' ' + zbscrm_JS_invoice_lang( 'or' ) + ' ';
							str +=
								'<a href="' +
								window.zbs_invoice.invoiceObj.settings.addnewcompanyurl +
								'" target="_blank">' +
								zbscrm_JS_invoice_lang( 'newcompany' ) +
								'</a>';
						}
						return (
							'<div class="zbs-add-new-js-assign-to"><i class="address book icon"></i>  ' +
							str +
							'</div>'
						);
					},
				},
			}
		)
		.on( 'typeahead:selected', select )
		.on( 'typeahead:change', change );

	// WH added to KILL autocomplete for this
	// Ported from admin.global variant
	//autocomplete="zbs-concom-time' + window.zbscrm_js_autocomplete_chaff + '"

	// BRUTALLY setup all for autocomplete to die :)
	setTimeout( function () {
		var utc = new Date().getTime();
		var k = jQuery( '#billing-to .typeahead' ).attr( 'data-autokey' );
		if ( typeof k === 'undefined' ) {
			var k = '-typeahead';
		}
		var ns = 'zbsobj-' + utc + '-' + k;
		jQuery( '#billing-to .typeahead' ).attr( 'autocomplete', ns ).attr( 'name', ns );
	}, 0 );
	jQuery( this ).on( 'typeahead:open', function ( ev, suggestion ) {
		// force all typeaheads to be NOT AUTOCOMPLETE
		var utc = new Date().getTime();
		var k = jQuery( '#billing-to .typeahead' ).attr( 'data-autokey' );
		if ( typeof k === 'undefined' ) {
			var k = '-typeahead';
		}
		var ns = 'zbsobj-' + utc + '-' + k;
		jQuery( '#billing-to .typeahead' ).attr( 'autocomplete', ns ).attr( 'name', ns );
	} );
}

// adds/hides initial learn bar links to contact/company
// (after this it's updated by typeahead in zbscrm_JS_invoice_typeahead_bind)
/**
 *
 */
function zbscrm_JS_bindInitialLearnLinks() {
	// show hide learn menu links
	if (
		typeof window.zbs_invoice.invoiceObj !== 'undefined' &&
		typeof window.zbs_invoice.invoiceObj.invoice_contact !== 'undefined' &&
		window.zbs_invoice.invoiceObj.invoice_contact != '0' &&
		window.zbs_invoice.invoiceObj.invoice_contact != '-1'
	) {
		var cID = parseInt( window.zbs_invoice.invoiceObj.invoice_contact );
		if ( cID > 0 ) {
			zeroBSCRMJS_showContactLinkIf( cID );
		}
	}
	if (
		typeof window.zbs_invoice.invoiceObj !== 'undefined' &&
		typeof window.zbs_invoice.invoiceObj.invoice_company !== 'undefined' &&
		window.zbs_invoice.invoiceObj.invoice_company != '0' &&
		window.zbs_invoice.invoiceObj.invoice_company != '-1'
	) {
		var coID = parseInt( window.zbs_invoice.invoiceObj.invoice_company );
		if ( coID > 0 ) {
			zeroBSCRMJS_showCompanyLinkIf( coID );
		}
	}
}

// if a contact is selected (against a trans) can 'quick nav' to contact
/**
 * @param contactID
 */
function zeroBSCRMJS_showContactLinkIf( contactID ) {
	// remove old
	// NOT USING this bit jQuery('#zbs-customer-title .zbs-view-contact').remove();
	jQuery( '#zbs-invoice-learn-nav .zbs-invoice-quicknav-contact' ).remove();

	if ( typeof contactID !== 'undefined' && contactID !== null && contactID !== '' ) {
		contactID = parseInt( contactID );
		if ( contactID > 0 ) {
			// seems legit, add

			/* not using (from trans originally) var html = '<div class="ui right floated mini animated button zbs-view-contact">';
						html += '<div class="visible content">' + zbscrm_JS_invoice_lang('viewcontact') + '</div>';
							html += '<div class="hidden content">';
						    	html += '<i class="user icon"></i>';
						  	html += '</div>';
						html += '</div>';

				jQuery('#zbs-customer-title').prepend(html);

				// bind
				zeroBSCRMJS_bindContactLinkIf();
				*/

			// ALSO show in header bar, if so
			var navButton =
				'<a target="_blank" style="margin-left:6px;" class="zbs-invoice-quicknav-contact ui icon button blue mini labeled" href="' +
				window.zbs_invoice.invoiceObj.settings.contacturlprefix +
				contactID +
				'"><i class="user icon"></i> ' +
				zbscrm_JS_invoice_lang( 'contact' ) +
				'</a>';
			jQuery( '#zbs-invoice-learn-nav' ).prepend( navButton );
		}
	}
}

/* Not using, (from trans editor originally)
// click for quicknav :)
function zeroBSCRMJS_bindContactLinkIf(){

	jQuery('#zbs-customer-title .zbs-view-contact').off('click').on( 'click', function(){

		// get from hidden input
		var contactID = parseInt(jQuery("#customer").val());//jQuery(this).attr('data-invid');

		if (typeof contactID != "undefined" && contactID !== null && contactID !== ''){
			contactID = parseInt(contactID);
			if (contactID > 0){

				var url = '<?php echo jpcrm_esc_link('edit',-1,'zerobs_customer',true); ?>' + contactID;

				// bla bla https://stackoverflow.com/questions/1574008/how-to-simulate-target-blank-in-javascript
				window.open(url,'_parent');
			}
		}

	});
}

// click for quicknav :)
function zeroBSCRMJS_bindCompanyLinkIf(){

	jQuery('#zbs-company-title .zbs-view-company').off('click').on( 'click', function(){

		// get from hidden input
		var companyID = parseInt(jQuery("#zbsct_company").val());//jQuery(this).attr('data-invid');

		if (typeof companyID != "undefined" && companyID !== null && companyID !== ''){
			companyID = parseInt(companyID);
			if (companyID > 0){

				var url = '<?php echo jpcrm_esc_link('edit',-1,'zerobs_company',true); ?>' + companyID;

				// bla bla https://stackoverflow.com/questions/1574008/how-to-simulate-target-blank-in-javascript
				window.open(url,'_parent');
			}
		}

	});
}*/

// if an Company is selected (against a trans) can 'quick nav' to Company
/**
 * @param companyID
 */
function zeroBSCRMJS_showCompanyLinkIf( companyID ) {
	// remove old
	//jQuery('#zbs-company-title .zbs-view-company').remove();
	jQuery( '#zbs-invoice-learn-nav .zbs-invoice-quicknav-company' ).remove();

	if ( typeof companyID !== 'undefined' && companyID !== null && companyID !== '' ) {
		companyID = parseInt( companyID );
		if ( companyID > 0 ) {
			// seems like a legit inv, add

			/* not using here, (orig from trans)
				var html = '<div class="ui right floated mini animated button zbs-view-company">';
						html += '<div class="visible content"><?php  zeroBSCRM_slashOut(__('View','zero-bs-crm')); ?></div>';
							html += '<div class="hidden content">';
						    	html += '<i class="building icon"></i>';
						  	html += '</div>';
						html += '</div>';

				jQuery('#zbs-company-title').prepend(html);

				// bind
				zeroBSCRMJS_bindCompanyLinkIf();
				*/

			// ALSO show in header bar, if so
			var navButton =
				'<a target="_blank" style="margin-left:6px;" class="zbs-invoice-quicknav-company ui icon button blue mini labeled" href="' +
				window.zbs_invoice.invoiceObj.settings.companyurlprefix +
				companyID +
				'"><i class="building icon"></i> ' +
				zbscrm_JS_invoice_lang( 'company' ) +
				'</a>';
			jQuery( '#zbs-invoice-learn-nav' ).prepend( navButton );
		}
	}
}

// all this stuff was only working because it was pasted into the end of one of my other bind functions... this stuff needs its own place!
/**
 *
 */
function zbscrm_JS_bind_invoice_actions() {
	// Show Hides
	jQuery( '.zbs-add-memo-trigger' )
		.off( 'click' )
		.on( 'click', function ( e ) {
			jQuery( '.zbs-memo-box' ).show();
			jQuery( '.zbs-add-memo-trigger' ).hide();
		} );
	jQuery( '.zbs-memo-hide' )
		.off( 'click' )
		.on( 'click', function ( e ) {
			jQuery( '.zbs-memo-box' ).hide();
			jQuery( '.zbs-add-memo-trigger' ).show();
		} );
	jQuery( '.wh-logo-set .zbs-remove' )
		.off( 'click' )
		.on( 'click', function ( e ) {
			jQuery( '#wh-logo-set-img' ).attr( 'src', '' ).hide();
			jQuery( '#zbs_invoice_logo' ).val( '' );
			jQuery( '.wh-logo' ).removeClass( 'hide' ).show();
			jQuery( '.wh-logo-set' ).hide();
		} );
	jQuery( '.business-info-toggle' )
		.off( 'click' )
		.on( 'click', function ( e ) {
			e.preventDefault();
			if ( jQuery( '.business-info-toggle i' ).hasClass( 'fa-chevron-circle-right' ) ) {
				jQuery( '.business-info-toggle i' )
					.removeClass( 'fa-chevron-circle-right' )
					.addClass( 'fa-chevron-circle-down' );
				jQuery( '.business-info' ).show();
			} else {
				jQuery( '.business-info-toggle i' )
					.removeClass( 'fa-chevron-circle-down' )
					.addClass( 'fa-chevron-circle-right' );
				jQuery( '.business-info' ).hide();
			}
		} );

	// Save
	/* this is now replaced by .zbs-edit-save
		.zbs_invoice_save => .zbs-edit-save
	... in /js/ZeroBSCRM.admin.editview.js
	... which offers generic "save" for all edit views, inc dirty protection

	jQuery('#zbs_invoice_save').off('click').on('click',function(e){
		e.preventDefault();
		if (jQuery(this).hasClass('disabled')){
			return false;
		}
		jQuery('#post').submit();
	}); */

	// Logo
	jQuery( '.wh-logo, .wh-logo-set .zbs-update' )
		.off( 'click' )
		.on( 'click', function ( e ) {
			var zbs_media_frame;
			e.preventDefault();
			// Get our Parent element
			formlabel = jQuery( this ).parent();
			// If the frame already exists, re-open it.
			if ( zbs_media_frame ) {
				zbs_media_frame.open();
				return;
			}
			zbs_media_frame = wp.media.frames.zbs_media_frame = wp.media( {
				//Create our media frame
				className: 'media-frame zbs-media-frame',
				frame: 'select', //Allow Select Only
				multiple: false, //Disallow Mulitple selections
				library: {
					type: 'image', //Only allow images
				},
			} );
			zbs_media_frame.on( 'select', function () {
				// Grab our attachment selection and construct a JSON representation of the model.
				var media_attachment = zbs_media_frame.state().get( 'selection' ).first().toJSON();

				// Send the attachment URL to our custom input field via jQuery.

				jQuery( '#logo' ).val( media_attachment.url );
				jQuery( '#wh-logo-set-img' ).attr( 'src', media_attachment.url ).show();
				jQuery( '.wh-logo-set' ).show();
				jQuery( '.wh-logo' ).hide();
			} );

			// Now that everything has been set, let's open up the frame.
			zbs_media_frame.open();
		} );

	// Download
	jQuery( '#zbs_invoicing_download_pdf' )
		.off( 'click' )
		.on( 'click', function ( e ) {
			e.preventDefault();
			jQuery( '#zbs_invoicing_download_pdf_form' ).submit();
		} );

	//the select box options. Bind here
	zbscrm_JS_bind_due_days();

	//date picker bind
	zbscrm_JS_bindDateRangePicker();

	//bind typeahead
	zbscrm_JS_invoice_typeahead_bind();

	// bind initial learn menu links
	zbscrm_JS_bindInitialLearnLinks();

	//calculate row totals
	zbscrm_JS_calculate_invoice_row_subtotals();

	//calculate the invoice subtotal.
	zbscrm_JS_calcTotals();

	// send email button
	jQuery( '#zbs_invoicing_send_email' )
		.off( 'click' )
		.on( 'click', function ( ind, ele ) {
			zbscrmJS_sendInvoiceModal();
		} );
}

// ========================================================================
// ======= /Binds
// ========================================================================

// ========================================================================
// ======= Helpers
// ========================================================================

/**
 *
 */
function zbscrmJS_sendInvoiceModal() {
	// retrieve
	var invEmail = '';
	var potentialEmail = zbscrmJS_retrieveCurrentBillToEmail();
	if (
		typeof potentialEmail !== 'undefined' &&
		potentialEmail != '' &&
		zbscrm_JS_validateEmail( potentialEmail )
	) {
		// then set
		invEmail = potentialEmail;
	}

	// only if legit email
	if ( typeof invEmail !== 'undefined' && invEmail != '' && zbscrm_JS_validateEmail( invEmail ) ) {
		// build options html
		var optsHTML = '<div id="zbs_invoice_email_modal_opts">';

		// to
		optsHTML += '<div class="zbs-invoice-email-modal-field">';
		optsHTML +=
			'<label for="zbs_invoice_email_modal_toemail">' +
			zbscrm_JS_invoice_lang( 'toemail' ) +
			'</label>';
		optsHTML +=
			'<input type="email" id="zbs_invoice_email_modal_toemail" value="' +
			invEmail +
			'" placeholder="' +
			zbscrm_JS_invoice_lang( 'toemailplaceholder' ) +
			'" />';
		optsHTML += '</div>';

		// attach associated pdfs? (if any)
		if ( jQuery( '.zbsFileLine' ).length > 0 ) {
			optsHTML += '<div class="zbs-invoice-email-modal-field">';
			var checkedStr = '';
			if ( jQuery( '#zbsc_sendattachments' ).is( ':checked' ) ) {
				checkedStr = 'checked="checked" ';
			}
			optsHTML +=
				'<input type="checkbox" id="zbs_invoice_email_modal_attachassoc" value="1" ' +
				checkedStr +
				'/>';
			optsHTML +=
				'<label for="zbs_invoice_email_modal_attachassoc">' +
				zbscrm_JS_invoice_lang( 'attachassoc' ) +
				'</label>';
			optsHTML += '</div>';
		}

		// attach inv as pdf?
		var checkedStr = 'checked="checked" '; // default yes
		optsHTML += '<div class="zbs-invoice-email-modal-field">';
		optsHTML +=
			'<input type="checkbox" id="zbs_invoice_email_modal_attachaspdf" value="1" ' +
			checkedStr +
			'/>';
		optsHTML +=
			'<label for="zbs_invoice_email_modal_attachaspdf">' +
			zbscrm_JS_invoice_lang( 'attachpdf' ) +
			'</label>';
		optsHTML += '</div>';

		optsHTML += '</div>';

		// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
		swal( {
			title: zbscrm_JS_invoice_lang( 'send_email' ),
			html:
				'<div class="ui segment">' +
				zbscrm_JS_invoice_lang( 'sendthisemail' ) +
				optsHTML +
				'</div>',
			type: 'question',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: zbscrm_JS_invoice_lang( 'sendthemail' ),
			//allowOutsideClick: false
		} ).then( function ( result ) {
			// this check required from swal2 6.0+
			if ( result.value ) {
				var invEmail = jQuery( '#zbs_invoice_email_modal_toemail' ).val();
				if (
					typeof invEmail !== 'undefined' &&
					invEmail != '' &&
					zbscrm_JS_validateEmail( invEmail ) &&
					window.invoice_id > 0
				) {
					// get settings
					var attachassoc = -1;
					if (
						jQuery( '#zbs_invoice_email_modal_attachassoc' ).length > 0 &&
						jQuery( '#zbs_invoice_email_modal_attachassoc' ).is( ':checked' )
					) {
						attachassoc = 1;
					}
					var attachpdf = -1;
					if (
						jQuery( '#zbs_invoice_email_modal_attachaspdf' ).length > 0 &&
						jQuery( '#zbs_invoice_email_modal_attachaspdf' ).is( ':checked' )
					) {
						attachpdf = 1;
					}
					var params = {
						id: window.invoice_id,
						email: invEmail,
						attachassoc: attachassoc,
						attachpdf: attachpdf,
					};

					// debug console.log('sending to ' + invEmail, params);

					// send email
					swal.fire( {
						title: zbscrm_JS_invoice_lang( 'sendingemail' ),
						html:
							'<div style="clear:both">&nbsp;</div><div class="ui active loader" style="margin-top:2em;padding-bottom:2em"></div><div style="clear:both">&nbsp;</div>',
						showConfirmButton: false,
						showCancelButton: false,
						allowOutsideClick: false,
					} );
					zbscrmJS_sendInvoiceEmail( params );
				} else {
					// not legit email!
					swal.fire( zbscrm_JS_invoice_lang( 'sendneedsassignment' ) );
				}
			}
		} );
	} else {
		// not legit email!
		swal.fire( zbscrm_JS_invoice_lang( 'sendneedsassignment' ) );
	}
}

/**
 * @param params
 */
function zbscrmJS_sendInvoiceEmail( params ) {
	if ( ! window.zbsInvBlocker ) {
		window.zbsInvBlocker = true;

		// check params?
		if (
			typeof params.id !== 'undefined' &&
			params.id > 0 &&
			typeof params.email !== 'undefined' &&
			zbscrm_JS_validateEmail( params.email )
		) {
			// assume params legit, add req. fields
			params.action = 'zbs_invoice_send_invoice';
			params.security = jQuery( '#inv-ajax-nonce' ).val();
			jQuery.ajax( {
				url: ajaxurl,
				type: 'POST',
				data: params,
				dataType: 'json',
				success: function ( response ) {
					// debug
					//console.log('sent',response);

					// done
					swal( zbscrm_JS_invoice_lang( 'senttitle' ), zbscrm_JS_invoice_lang( 'sent' ), 'info' );

					// blocker
					window.zbsInvBlocker = false;
				},
				error: function ( response ) {
					// debug
					console.error( 'senderr', response );

					// err
					swal(
						zbscrm_JS_invoice_lang( 'senderrortitle' ) + ' #19v3',
						zbscrm_JS_invoice_lang( 'senderror' ),
						'error'
					);

					// blocker
					window.zbsInvBlocker = false;
				},
			} );
		} // / if deets check out
	} // / if not blocked
}

//converts an invoice link to a transaction link.
/**
 * @param id
 */
function zbscrm_JS_transaction_edit_URL( id ) {
	// 3.0
	if ( zbscrm_JS_DAL() > 2 ) {
		return zeroBSCRMJS_obj_editLink( 'transaction', id );
	}
	// <3.0

	//admin URL is
	zbs_admin_url = window.zbs_links.admin_url;

	//transaction link is (currently) DB3.0 change
	zbs_transaction_link = zbs_admin_url + 'post.php?action=edit&post=' + id;
	return zbs_transaction_link;
}

/**
 * @param key
 */
function zeroBSCRMJS_invEditLang( key ) {
	if ( typeof window.zbsInvoiceBuilderLang[ key ] !== 'undefined' ) {
		return window.zbsInvoiceBuilderLang[ key ];
	}
	return '';
}

/**
 *
 */
function zbscrm_JS_calcTotals() {
	//calculate the invoice subtotal.
	zbscrm_JS_calculate_invoice_subtotal();
	zbscrm_JS_calculatediscount();
	zbscrm_JS_calculate_invoice_tax_table();
	zbscrm_JS_calc_grandtotal();
}

// passes language from window.zbsListViewLangLabels (js set in listview php)
/**
 * @param key
 * @param fallback
 * @param subkey
 */
function zbscrm_JS_invoice_lang( key, fallback, subkey ) {
	if ( typeof fallback === 'undefined' ) {
		var fallback = '';
	}

	if ( typeof window.zbs_invoice.invoiceObj.settings.lang[ key ] !== 'undefined' ) {
		if ( typeof subkey === 'undefined' ) {
			return window.zbs_invoice.invoiceObj.settings.lang[ key ];
		} else if (
			typeof window.zbs_invoice.invoiceObj.settings.lang[ key ][ subkey ] !== 'undefined'
		) {
			return window.zbs_invoice.invoiceObj.settings.lang[ key ][ subkey ];
		}
	}

	return fallback;
}
// ========================================================================
// ======= /Helpers
// ========================================================================

if ( typeof module !== 'undefined' ) {
    module.exports = { zbs_invoice, zbs_tax, zbs_tax_table, zbsInvBlocker,
		zbscrm_JS_retrieve_invoice_data, zbscrm_JS_draw_invoice_html,
		zbscrm_JS_draw_invoice_actions_html, zbscrmJS_retrieveCurrentBillToEmail,
		zbscrm_JS_draw_invoice_logo_html, zbscrm_JS_draw_invoice_top_right_form, zbscrm_JS_draw_send_invoice_to,
		zbscrm_JS_draw_customise, zbscrm_JS_draw_invoice_biz_info,
		zbscrm_JS_draw_line_items, zbscrm_JS_draw_invoice_totals,
		zbscrm_JS_draw_partials_table, zbscrm_JS_generate_invoice_row,
		zbscrm_JS_output_tax_line, zbscrm_JS_add_empty_row, zbscrm_JS_bind_due_days,
		zbscrm_JS_bind_row_actions, zbscrm_JS_calculate_invoice_row_subtotals,
		zbscrm_JS_calculate_invoice_subtotal, zbscrm_JS_calculate_invoice_tax_table,
		zbscrm_JS_pickTaxRate, zbscrm_JS_calculate_tax_amounts,
		zbscrm_JS_calc_grandtotal, zbscrm_JS_calc_amount_due,
		zbscrm_JS_bind_change_actions, zbscrm_JS_calculatediscount,
		zbscrm_JS_invoice_typeahead_bind, zbscrm_JS_bindInitialLearnLinks,
		zeroBSCRMJS_showContactLinkIf, zeroBSCRMJS_showCompanyLinkIf,
		zbscrm_JS_bind_invoice_actions, zbscrmJS_sendInvoiceModal,
		zbscrmJS_sendInvoiceEmail, zbscrm_JS_transaction_edit_URL,
		zeroBSCRMJS_invEditLang, zbscrm_JS_calcTotals, zbscrm_JS_invoice_lang };
}
