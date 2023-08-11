/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.2
 *
 * Copyright 2020 Automattic
 *
 * Date: 29/12/16
 */

( function () {
	// hardtyped, unless window.jpcrm_placeholder_list is set (overrides)
	var template_placeholders = [
		{ text: 'Contact Full Name', value: '##CONTACT-FULLNAME##' },
		{ text: 'Contact First Name', value: '##CONTACT-FNAME##' },
		{ text: 'Contact Last Name', value: '##CONTACT-LNAME##' },
		{ text: 'Contact Email', value: '##CONTACT-EMAIL##' },
		{ text: 'Business Name', value: '##BIZ-NAME##' },
		{ text: 'Business State/Region', value: '##BIZSTATE##' },
		{ text: 'Quote Title', value: '##QUOTE-TITLE##' },
		{ text: 'Quote Value', value: '##QUOTEVALUE##' },
		{ text: 'Quote Date', value: '##QUOTEDATE##' },
	];

	// check for override
	if ( typeof window.jpcrm_placeholder_list !== 'undefined' ) {
		template_placeholders = window.jpcrm_placeholder_list;
	}

	tinymce.PluginManager.add( 'zbsQuoteTemplates', function ( editor, url ) {
		// This is simple button
		editor.addButton( 'zbsQuoteTemplates', {
			title: 'Quote Template Placeholders',
			image: window.zbs_root.root + 'i/WYSIWYG_icon.png',
			//icon: 'icon dashicons-tickets',
			onclick: function () {
				// Open window
				editor.windowManager.open( {
					title: 'Select a Placeholder to Insert:',
					width: 600,
					height: 120,
					body: [
						{
							type: 'listbox',
							name: 'zbscrmtemplateplaceholder',
							label: 'Placeholder',
							values: template_placeholders,
							//'value': window.zbsSelectedFormStyle
						},
					],
					onsubmit: function ( e ) {
						tinymce.activeEditor.execCommand(
							'mceInsertContent',
							false,
							e.data.zbscrmtemplateplaceholder
						);
					},
				} );
			},
		} );
	} );
} )();
