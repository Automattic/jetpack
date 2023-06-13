/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.1.17
 *
 * Copyright 2020 Automattic
 *
 * Date: 13/09/16
 */

( function () {
	// brutally hardtyped, later move from
	var formStyles = [
		{ text: 'Naked', value: 'naked' },
		{ text: 'Content Grab', value: 'cgrab' },
		{ text: 'Simple', value: 'simple' },
	];

	// Next ver, make this auto-choose right style saved against a form
	// using custom dialog as bottom answer here:
	// http://stackoverflow.com/questions/27053290/tinymce-4-plugin-preselect-listbox-option-when-dialog-opens
	// #TINYMCETODO
	//var zbsSelectedFormStyle = 'simple';

	// needs to be set in PHP, this just builds it into a usable form for tinymce
	if ( typeof window.zbsCRMFormList === 'undefined' ) {
		var zbsCRMFormList = [ { text: 'No Forms Available', value: -1 } ];
	} else {
		// process it into a usable form
		var formedFormList = [];
		jQuery.each( window.zbsCRMFormList, function ( ind, ele ) {
			// make title
			if ( ele.title != '' ) {
				var eleTitle = ele.title;
			} else {
				var eleTitle = 'Form #' + ele.id;
			}

			var formObj = {
				text: eleTitle,
				value: ele.id,
			};

			// add to list
			formedFormList.push( formObj );
		} );

		// set list
		window.zbsCRMFormList = formedFormList;
	}

	// catch
	if ( typeof window.zbsCRMFormList === 'undefined' ) {
		window.zbsCRMFormList = [ { text: 'No Forms Available', value: -1 } ];
	}

	tinymce.PluginManager.add( 'zbsCRMForms', function ( editor, url ) {
		var thisTitle = 'CRM Forms';

		if ( ! window.zbs_root ) {
			// if no CRM env is detected, don't make a button
			return;
		}
		if ( typeof window.zbs_root.crmname !== 'undefined' ) {
			thisTitle = window.zbs_root.crmname + ' Forms';
		}

		var thisIco = window.zbs_root.root + 'i/WYSIWYG_icon.png';
		if ( typeof window.zbs_root.crmlogo !== 'undefined' ) {
			thisIco = window.zbs_root.root + window.zbs_root.crmlogo;
		}

		editor.addButton( 'zbsCRMForms', {
			title: thisTitle,
			image: thisIco,
			//icon: 'icon dashicons-tickets',
			onclick: function () {
				// Open window
				editor.windowManager.open( {
					title: 'Select a Form Widget:',
					width: 400,
					height: 120,
					body: [
						//{type: 'textbox', name: 'title', label: 'Title'}
						{
							type: 'listbox',
							name: 'zbscrmformid',
							label: 'Which Form?',
							values: window.zbsCRMFormList,
						},
						{
							type: 'listbox',
							name: 'zbscrmformstyle',
							label: 'Form Style',
							values: formStyles,
							//'value': window.zbsSelectedFormStyle
						},
					],
					onsubmit: function ( e ) {
						if ( e.data.zbscrmformid != -1 ) {
							tinymce.activeEditor.execCommand(
								'mceInsertContent',
								false,
								'[jetpackcrm_form id="' +
									e.data.zbscrmformid +
									'" style="' +
									e.data.zbscrmformstyle +
									'"]'
							);
						} else {
							tinymce.activeEditor.execCommand( 'mceInsertContent', false, 'No Form Selected' );
						}
					},
				} );
			},
		} );
	} );
} )();
