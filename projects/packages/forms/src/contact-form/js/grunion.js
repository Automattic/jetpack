/* global GrunionFB_i18n: true, FB, ajax_nonce_shortcode, ajax_nonce_json, ajaxurl, postId */

if ( ! window.FB ) {
	window.FB = {};
}

GrunionFB_i18n = jQuery.extend(
	{
		nameLabel: 'Name',
		emailLabel: 'Email',
		urlLabel: 'Website',
		commentLabel: 'Comment',
		newLabel: 'New Field',
		optionsLabel: 'Options',
		optionLabel: 'Option',
		firstOptionLabel: 'First option',
		problemGeneratingForm:
			"Oops, there was a problem generating your form.  You'll likely need to try again.",
		moveInstructions: 'Drag up or down\nto re-arrange',
		moveLabel: 'move',
		editLabel: 'edit',
		savedMessage: 'Saved successfully',
		requiredLabel: '(required)',
		exitConfirmMessage:
			'Are you sure you want to exit the form editor without saving?  Any changes you have made will be lost.',
		maxNewFields: 5,
		invalidEmail: ' is an invalid email address.',
	},
	GrunionFB_i18n
);

GrunionFB_i18n.moveInstructions = GrunionFB_i18n.moveInstructions.replace( '\n', '<br />' );

FB.span = jQuery( '<span>' );
FB.esc_html = function ( string ) {
	return FB.span.text( string ).html();
};

FB.esc_attr = function ( string ) {
	string = FB.esc_html( string );
	return string.replace( '"', '&quot;' ).replace( "'", '&#039;' );
};

FB.ContactForm = ( function () {
	const fbForm = {
		// Main object that generated shortcode via AJAX call
		action: 'grunion_shortcode',
		_ajax_nonce: ajax_nonce_shortcode,
		to: '',
		subject: '',
		fields: {},
	};
	const defaultFields = {
		name: {
			label: GrunionFB_i18n.nameLabel,
			type: 'name',
			required: true,
			options: [],
			order: '1',
		},
		email: {
			label: GrunionFB_i18n.emailLabel,
			type: 'email',
			required: true,
			options: [],
			order: '2',
		},
		url: {
			label: GrunionFB_i18n.urlLabel,
			type: 'url',
			required: false,
			options: [],
			order: '3',
		},
		comment: {
			label: GrunionFB_i18n.commentLabel,
			type: 'textarea',
			required: true,
			options: [],
			order: '4',
		},
	};
	const debug = false; // will print errors to log if true
	let grunionNewCount = 0; // increment for new fields
	const maxNewFields = GrunionFB_i18n.maxNewFields; // See filter in ../grunion-form-view.php
	let optionsCache = {};
	let optionsCount = 0; // increment for options
	let shortcode; //eslint-disable-line no-unused-vars

	/**
	 *
	 */
	function addField() {
		try {
			grunionNewCount++;
			if ( grunionNewCount <= maxNewFields ) {
				// Add to preview
				jQuery( '#fb-extra-fields' ).append(
					'<div id="fb-new-field' +
						grunionNewCount +
						'" fieldid="' +
						grunionNewCount +
						'" class="fb-new-fields"><div class="fb-fields"><div id="' +
						grunionNewCount +
						'" class="fb-remove"></div><label fieldid="' +
						grunionNewCount +
						'" for="fb-field' +
						grunionNewCount +
						'"><span class="label-text">' +
						GrunionFB_i18n.newLabel +
						'</span> </label><input type="text" id="fb-field' +
						grunionNewCount +
						'" disabled="disabled" /></div></div>'
				);
				// Add to form object
				fbForm.fields[ grunionNewCount ] = {
					label: GrunionFB_i18n.newLabel,
					type: 'text',
					required: false,
					options: [],
					order: '5',
				};
				if ( grunionNewCount === maxNewFields ) {
					jQuery( '#fb-new-field' ).hide();
				}
				// Reset form for this new field
				optionsCount = 0;
				optionsCache = {};
				jQuery( '#fb-new-options' ).html(
					'<label for="fb-option0">' +
						GrunionFB_i18n.optionsLabel +
						'</label><input type="text" id="fb-option0" optionid="0" value="' +
						GrunionFB_i18n.firstOptionLabel +
						'" class="fb-options" />'
				);
				jQuery( '#fb-options' ).hide();
				jQuery( '#fb-new-label' ).val( GrunionFB_i18n.newLabel );
				jQuery( '#fb-new-type' ).val( 'text' );
				jQuery( '#fb-field-id' ).val( grunionNewCount );
				setTimeout( function () {
					jQuery( '#fb-new-label' ).focus().select();
				}, 100 );
			} else {
				jQuery( '#fb-new-field' ).hide();
			}
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'addField(): ' + e );
			}
		}
	}
	/**
	 *
	 */
	function addOption() {
		try {
			optionsCount = jQuery( '#fb-new-options .fb-options' ).length;
			const thisId = jQuery( '#fb-field-id' ).val();
			const thisType = jQuery( '#fb-new-type' ).val();
			if ( thisType === 'radio' ) {
				// Add to right col
				jQuery( '#fb-new-options' ).append(
					'<div id="fb-option-box-' +
						optionsCount +
						'" class="fb-new-fields"><span optionid="' +
						optionsCount +
						'" class="fb-remove-option"></span><label></label><input type="text" id="fb-option' +
						optionsCount +
						'" optionid="' +
						optionsCount +
						'" value="' +
						GrunionFB_i18n.optionLabel +
						'" class="fb-options" /><div>'
				);
				// Add to preview
				jQuery( '#fb-new-field' + thisId + ' .fb-fields' ).append(
					'<div id="fb-radio-' +
						thisId +
						'-' +
						optionsCount +
						'"><input type="radio" disabled="disabled" id="fb-field' +
						thisId +
						'" name="radio-' +
						thisId +
						'" /><span>' +
						GrunionFB_i18n.optionLabel +
						'</span><div class="clear"></div></div>'
				);
			} else if ( 'checkbox-multiple' === thisType ) {
				// Add to right col
				jQuery( '#fb-new-options' ).append(
					'<div id="fb-option-box-' +
						optionsCount +
						'" class="fb-new-fields"><span optionid="' +
						optionsCount +
						'" class="fb-remove-option"></span><label></label><input type="text" id="fb-option' +
						optionsCount +
						'" optionid="' +
						optionsCount +
						'" value="' +
						GrunionFB_i18n.optionLabel +
						'" class="fb-options" /><div>'
				);
				// Add to preview
				jQuery( '#fb-new-field' + thisId + ' .fb-fields' ).append(
					'<div id="fb-checkbox-multiple-' +
						thisId +
						'-' +
						optionsCount +
						'"><input type="checkbox" disabled="disabled" id="fb-field' +
						thisId +
						'" name="checkbox-multiple-' +
						thisId +
						'" /><span>' +
						GrunionFB_i18n.optionLabel +
						'</span><div class="clear"></div></div>'
				);
			} else {
				// Add to right col
				jQuery( '#fb-new-options' ).append(
					'<div id="fb-option-box-' +
						optionsCount +
						'" class="fb-new-fields"><span optionid="' +
						optionsCount +
						'" class="fb-remove-option"></span><label></label><input type="text" id="fb-option' +
						optionsCount +
						'" optionid="' +
						optionsCount +
						'" value="" class="fb-options" /><div>'
				);
				// Add to preview
				jQuery( '#fb-field' + thisId ).append(
					'<option id="fb-' +
						thisId +
						'-' +
						optionsCount +
						'" value="' +
						thisId +
						'-' +
						optionsCount +
						'"></option>'
				);
			}
			// Add to fbForm object
			fbForm.fields[ thisId ].options[ optionsCount ] = '';
			// Add focus to new field
			jQuery( '#fb-option' + optionsCount )
				.focus()
				.select();
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'addOption(): ' + e );
			}
		}
	}
	/**
	 *
	 */
	function buildPreview() {
		try {
			if ( fbForm.to ) {
				jQuery( '#fb-field-my-email' ).val( fbForm.to );
			}
			if ( fbForm.subject ) {
				jQuery( '#fb-field-subject' ).val( fbForm.subject );
			}
			// Loop over and add fields
			jQuery.each( fbForm.fields, function ( index, value ) {
				jQuery( '#fb-extra-fields' ).before(
					'<div class="fb-new-fields ui-state-default" fieldid="' +
						index +
						'" id="fb-new-field' +
						index +
						'"><div class="fb-fields"></div></div>'
				);
				jQuery( '#fb-field-id' ).val( index );
				optionsCache[ index ] = {};
				optionsCache[ index ].options = [];
				if (
					'radio' === value.type ||
					'select' === value.type ||
					'checkbox-multiple' === value.type
				) {
					jQuery.each( value.options, function ( i, value ) {
						optionsCache[ index ].options[ i ] = value;
					} );
				}
				updateType( value.type, value.label, value.required );
			} );
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'buildPreview(): ' + e );
			}
		}
	}
	/**
	 * @param id
	 * @param thisType
	 */
	function customOptions( id, thisType ) {
		try {
			let thisOptions = '';
			for ( let i = 0; i < optionsCache[ id ].options.length; i++ ) {
				if ( optionsCache[ id ].options[ i ] !== undefined ) {
					if ( thisType === 'radio' ) {
						thisOptions =
							thisOptions +
							'<div id="fb-radio-' +
							id +
							'-' +
							i +
							'"><input type="radio" id="fb-field' +
							id +
							'" name="radio-' +
							id +
							'" /><span>' +
							FB.esc_html( optionsCache[ id ].options[ i ] ) +
							'</span><div class="clear"></div></div>';
					} else if ( 'checkbox-multiple' === thisType ) {
						thisOptions =
							thisOptions +
							'<div id="fb-checkbox-multiple-' +
							id +
							'-' +
							i +
							'"><input type="checkbox" id="fb-field' +
							id +
							'" name="checkbox-multiple-' +
							id +
							'" /><span>' +
							FB.esc_html( optionsCache[ id ].options[ i ] ) +
							'</span><div class="clear"></div></div>';
					} else {
						thisOptions =
							thisOptions +
							'<option id="fb-' +
							id +
							'-' +
							i +
							'" value="' +
							id +
							'-' +
							i +
							'">' +
							FB.esc_html( optionsCache[ id ].options[ i ] ) +
							'</option>';
					}
				}
			}
			return thisOptions;
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'customOptions(): ' + e );
			}
		}
	}
	/**
	 * @param that
	 */
	function deleteField( that ) {
		try {
			grunionNewCount--;
			const thisId = that.attr( 'id' );
			delete fbForm.fields[ thisId ];
			jQuery( '#' + thisId )
				.parent()
				.parent()
				.remove();
			if ( grunionNewCount <= maxNewFields ) {
				jQuery( '#fb-new-field' ).show();
			}
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'deleteField(): ' + e );
			}
		}
	}
	/**
	 * @param that
	 */
	function editField( that ) {
		try {
			scroll( 0, 0 );
			setTimeout( function () {
				jQuery( '#fb-new-label' ).focus().select();
			}, 100 );
			const thisId = that.parent().attr( 'fieldid' );
			loadFieldEditor( thisId );
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'editField(): ' + e );
			}
		}
	}
	/**
	 *
	 */
	function grabShortcode() {
		try {
			// Takes fbForm object and returns shortcode syntax
			jQuery.post( ajaxurl, fbForm, function ( response ) {
				shortcode = response;
			} );
		} catch ( e ) {
			alert( GrunionFB_i18n.problemGeneratingForm );
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'grabShortcode(): ' + e );
			}
		}
	}
	/**
	 *
	 */
	function hideDesc() {
		jQuery( '#fb-desc' ).hide();
		jQuery( '#fb-add-field' ).show();
	}
	/**
	 *
	 */
	function hidePopup() {
		try {
			// copied from wp-includes/js/thickbox/thickbox.js
			jQuery( '#TB_imageOff', window.parent.document ).unbind( 'click' );
			jQuery( '#TB_closeWindowButton', window.parent.document ).unbind( 'click' );
			jQuery( '#TB_window', window.parent.document ).fadeOut( 'fast' );
			jQuery( 'body', window.parent.document ).removeClass( 'modal-open' );
			jQuery( '#TB_window,#TB_overlay,#TB_HideSelect', window.parent.document )
				.trigger( 'unload' )
				.unbind()
				.remove();
			jQuery( '#TB_load', window.parent.document ).remove();
			if ( typeof window.parent.document.body.style.maxHeight === 'undefined' ) {
				//if IE 6
				jQuery( 'body', 'html', window.parent.document ).css( { height: 'auto', width: 'auto' } );
				jQuery( 'html', window.parent.document ).css( 'overflow', '' );
			}
			window.parent.document.onkeydown = '';
			window.parent.document.onkeyup = '';
			return false;
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'hidePopup(): ' + e );
			}
		}
	}
	/**
	 * @param whichType
	 * @param that
	 */
	function hideShowEditLink( whichType, that ) {
		try {
			if ( whichType === 'show' ) {
				// Prevents showing links twice
				if ( jQuery( '.fb-edit-field' ).is( ':visible' ) ) {
					jQuery( '.fb-edit-field' ).remove();
				}
				that
					.find( 'label' )
					.prepend(
						'<span class="right fb-edit-field" style="font-weight: normal;"><a href="" class="fb-reorder"><div style="display: none;">' +
							GrunionFB_i18n.moveInstructions +
							'</div>' +
							GrunionFB_i18n.moveLabel +
							'</a>&nbsp;&nbsp;<span style="color: #C7D8DE;">|</span>&nbsp;&nbsp;<a href="" class="fb-edit">' +
							GrunionFB_i18n.editLabel +
							'</a></span>'
					);
			} else {
				jQuery( '.fb-edit-field' ).remove();
			}
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'hideShowEditLink(): ' + e );
			}
		}
	}
	/**
	 * @param id
	 */
	function loadFieldEditor( id ) {
		try {
			const thisType = fbForm.fields[ id ].type;
			jQuery( '#fb-options' ).hide();
			// Reset hidden field ID
			jQuery( '#fb-field-id' ).val( id );
			// Load label
			jQuery( '#fb-new-label' ).val( fbForm.fields[ id ].label );
			// Load type
			jQuery( '#fb-new-type' ).val( fbForm.fields[ id ].type );
			// Load required
			if ( fbForm.fields[ id ].required ) {
				jQuery( '#fb-new-required' ).prop( 'checked', true );
			} else {
				jQuery( '#fb-new-required' ).prop( 'checked', false );
			}
			// Load options if there are any
			if ( 'select' === thisType || 'radio' === thisType || 'checkbox-multiple' === thisType ) {
				const thisOptions = fbForm.fields[ id ].options;
				jQuery( '#fb-options' ).show();
				jQuery( '#fb-new-options' ).html( '' ); // Clear it all out
				for ( let i = 0; i < thisOptions.length; i++ ) {
					if ( thisOptions[ i ] !== undefined ) {
						if ( thisType === 'radio' ) {
							jQuery( '#fb-new-options' ).append(
								'<div id="fb-option-box-' +
									i +
									'" class="fb-new-fields"><span optionid="' +
									i +
									'" class="fb-remove-option"></span><label></label><input type="text" id="fb-option' +
									i +
									'" optionid="' +
									i +
									'" value="' +
									FB.esc_attr( fbForm.fields[ id ].options[ i ] ) +
									'" class="fb-options" /><div>'
							);
						} else {
							jQuery( '#fb-new-options' ).append(
								'<div id="fb-option-box-' +
									i +
									'" class="fb-new-fields"><span optionid="' +
									i +
									'" class="fb-remove-option"></span><label></label><input type="text" id="fb-option' +
									i +
									'" optionid="' +
									i +
									'" value="' +
									FB.esc_attr( fbForm.fields[ id ].options[ i ] ) +
									'" class="fb-options" /><div>'
							);
						}
					}
				}
			}
			// Load editor & hide description
			hideDesc();
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'loadFieldEditor(): ' + e );
			}
		}
	}
	/**
	 * @param data
	 */
	function parseShortcode( data ) {
		try {
			// Clean up fields by resetting them
			fbForm.fields = {};
			// Add new fields
			if ( ! data ) {
				fbForm.fields = defaultFields;
			} else {
				jQuery.each( data.fields, function ( index, value ) {
					if ( 1 === parseInt( value.required, 10 ) ) {
						value.required = 'true';
					}
					fbForm.fields[ index ] = value;
				} );
				fbForm.to = data.to;
				fbForm.subject = data.subject;
			}
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'parseShortcode(): ' + e );
			}
		}
	}
	/**
	 * @param optionId
	 */
	function removeOption( optionId ) {
		try {
			const thisId = jQuery( '#fb-field-id' ).val();
			const thisVal = jQuery( '#fb-option' + optionId ).val();
			const thisType = jQuery( '#fb-new-type' ).val();
			// Remove from right
			jQuery( '#fb-option-box-' + optionId ).remove();
			// Remove from preview
			if ( thisType === 'radio' ) {
				jQuery( '#fb-radio-' + thisId + '-' + optionId ).remove();
			} else if ( 'checkbox-multiple' === thisType ) {
				jQuery( '#fb-checkbox-multiple-' + thisId + '-' + optionId ).remove();
			} else {
				jQuery( '#fb-' + thisId + '-' + optionId ).remove();
			}
			// Remove from fbForm object
			const idx = fbForm.fields[ thisId ].options.indexOf( thisVal );
			if ( idx !== -1 ) {
				fbForm.fields[ thisId ].options.splice( idx, 1 );
			}
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'removeOption(): ' + e );
			}
		}
	}
	/**
	 *
	 */
	function removeOptions() {
		try {
			const thisId = jQuery( '#fb-field-id' ).val();
			jQuery( '#fb-options' ).hide();
			if ( optionsCache[ thisId ] === undefined ) {
				optionsCache[ thisId ] = {};
			}
			optionsCache[ thisId ].options = fbForm.fields[ thisId ].options; // Save options in case they change their mind
			fbForm.fields[ thisId ].options = []; // Removes all options
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'removeOptions(): ' + e );
			}
		}
	}
	/**
	 *
	 */
	function sendShortcodeToEditor() {
		try {
			// Serialize fields
			jQuery( 'div#sortable div.fb-new-fields' ).each( function ( index ) {
				const thisId = jQuery( this ).attr( 'fieldid' );
				fbForm.fields[ thisId ].order = index;
			} );
			// Export to WYSIWYG editor
			jQuery.post( ajaxurl, fbForm, function ( response ) {
				let isVisual = jQuery( '#edButtonPreview', window.parent.document ).hasClass( 'active' );
				/* WP 3.3+ */
				if ( ! isVisual ) {
					isVisual = jQuery( '#wp-content-wrap', window.parent.document ).hasClass( 'tmce-active' );
				}

				const win = window.dialogArguments || opener || parent || top;
				let currentCode;
				if ( isVisual ) {
					currentCode = win.tinyMCE.activeEditor.getContent();
				} else {
					currentCode = jQuery( '#editorcontainer textarea', window.parent.document ).val();
					/* WP 3.3+ */
					if ( typeof currentCode !== 'string' ) {
						currentCode = jQuery( '.wp-editor-area', window.parent.document ).val();
					}
				}
				const regexp = new RegExp(
					'\\[contact-form\\b.*?\\/?\\](?:[\\s\\S]+?\\[\\/contact-form\\])?'
				);

				// Remove new lines that cause BR tags to show up
				response = response.replace( /\n/g, ' ' );
				// Convert characters to comma
				response = response.replace( /%26#x002c;/g, ',' );

				// Add new shortcode
				if ( currentCode.match( regexp ) ) {
					if ( isVisual ) {
						win.tinyMCE.activeEditor.execCommand(
							'mceSetContent',
							false,
							currentCode.replace( regexp, response )
						);
					} else {
						// looks like the visual editor is disabled,
						// update the contents of the post directly
						jQuery( '#content', window.parent.document ).val(
							currentCode.replace( regexp, response )
						);
					}
				} else {
					try {
						win.send_to_editor( response );
					} catch ( e ) {
						if ( isVisual ) {
							win.tinyMCE.activeEditor.execCommand( 'mceInsertContent', false, response );
						} else {
							// looks like the visual editor is disabled,
							// update the contents of the post directly
							jQuery( '#content', window.parent.document ).val( currentCode + response );
						}
					}
				}
				hidePopup();
			} );
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'sendShortcodeToEditor(): ' + e );
			}
		}
	}
	/**
	 *
	 */
	function showDesc() {
		jQuery( '#fb-desc' ).show();
		jQuery( '#fb-add-field' ).hide();
	}
	/**
	 * @param message
	 */
	function showAndHideMessage( message ) {
		try {
			const newMessage = ! message ? GrunionFB_i18n.savedMessage : message;
			jQuery( '#fb-success' ).text( newMessage );
			jQuery( '#fb-success' ).slideDown( 'fast' );
			setTimeout( function () {
				jQuery( '#fb-success' ).slideUp( 'fast' );
			}, 2500 );
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'showAndHideMessage(): ' + e );
			}
		}
	}
	/**
	 * @param whichType
	 */
	function switchTabs( whichType ) {
		try {
			if ( whichType === 'preview' ) {
				if ( ! validateEmails( jQuery( '#fb-field-my-email' ).val() ) ) {
					return;
				}
				jQuery( '#tab-preview a' ).addClass( 'current' );
				jQuery( '#tab-settings a' ).removeClass( 'current' );
				jQuery( '#fb-preview-form, #fb-desc' ).show();
				jQuery( '#fb-email-settings, #fb-email-desc' ).hide();
				showAndHideMessage( GrunionFB_i18n.savedMessage );
			} else {
				jQuery( '#tab-preview a' ).removeClass( 'current' );
				jQuery( '#tab-settings a' ).addClass( 'current' );
				jQuery( '#fb-preview-form, #fb-desc, #fb-add-field' ).hide();
				jQuery( '#fb-email-settings, #fb-email-desc' ).show();
				jQuery( '#fb-field-my-email' ).focus().select();
			}
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'switchTabs(): ' + e );
			}
		}
	}
	/**
	 * @param emails
	 */
	function validateEmails( emails ) {
		// Field is allowed to be empty :)
		if ( 0 === emails.length ) {
			return true;
		}

		let $e,
			emailList = emails.split( ',' );

		for ( $e = 0; $e < emailList.length; $e++ ) {
			if ( false === validateEmail( emailList[ $e ] ) ) {
				alert( emailList[ $e ] + GrunionFB_i18n.invalidEmail );
				return false;
			}
		}

		return true;
	}
	/* Uses The Official Standard: RFC 5322 -- http://www.regular-expressions.info/email.html */
	/**
	 * @param email
	 */
	function validateEmail( email ) {
		const re = /^(?=[a-z0-9@.!#$%&'*+/=?^_`{|}~-]{6,254}$)(?=[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@)[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:(?=[a-z0-9-]{1,63}\.)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?=[a-z0-9-]{1,63}$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
		return re.test( email );
	}
	/**
	 *
	 */
	function updateLabel() {
		try {
			const thisId = jQuery( '#fb-field-id' ).val();
			const thisLabel = jQuery( '#fb-new-label' ).val();
			// Update preview
			if ( thisLabel.length === 0 ) {
				jQuery( '#fb-new-field' + thisId + ' label .label-text' ).text( GrunionFB_i18n.newLabel );
			} else {
				jQuery( '#fb-new-field' + thisId + ' label .label-text' ).text( thisLabel );
			}
			// Update fbForm object
			fbForm.fields[ thisId ].label = thisLabel;
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'updateLabel(): ' + e );
			}
		}
	}
	/**
	 *
	 */
	function updateMyEmail() {
		try {
			const thisEmail = jQuery( '#fb-field-my-email' ).val();
			fbForm.to = thisEmail;
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'updateMyEmail(): ' + e );
			}
		}
	}
	/**
	 * @param that
	 */
	function updateOption( that ) {
		try {
			const thisId = jQuery( '#fb-field-id' ).val();
			const thisOptionid = that.attr( 'optionid' );
			const thisOptionValue = that.val();
			const thisType = jQuery( '#fb-new-type' ).val();
			// Update preview
			if ( thisType === 'radio' ) {
				jQuery( '#fb-radio-' + thisId + '-' + thisOptionid + ' span' ).text( thisOptionValue );
			} else if ( 'checkbox-multiple' === thisType ) {
				jQuery( '#fb-checkbox-multiple-' + thisId + '-' + thisOptionid + ' span' ).text(
					thisOptionValue
				);
			} else {
				jQuery( '#fb-' + thisId + '-' + thisOptionid ).text( thisOptionValue );
			}
			// Update fbForm object
			fbForm.fields[ thisId ].options[ thisOptionid ] = thisOptionValue;
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'updateOption(): ' + e );
			}
		}
	}
	/**
	 *
	 */
	function updateRequired() {
		try {
			const thisId = jQuery( '#fb-field-id' ).val();
			const thisChecked = jQuery( '#fb-new-required' ).is( ':checked' );
			// Update object and preview
			if ( thisChecked ) {
				fbForm.fields[ thisId ].required = true;
				jQuery( '#fb-new-field' + thisId + ' label' ).append(
					'<span class="label-required">' + GrunionFB_i18n.requiredLabel + '</span>'
				);
			} else {
				fbForm.fields[ thisId ].required = false;
				jQuery( '#fb-new-field' + thisId + ' label .label-required' ).remove();
			}
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'updateRequired(): ' + e );
			}
		}
	}
	/**
	 *
	 */
	function updateSubject() {
		try {
			const thisSubject = jQuery( '#fb-field-subject' ).val();
			fbForm.subject = thisSubject;
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'updateSubject(): ' + e );
			}
		}
	}
	/**
	 * @param thisType
	 * @param thisLabelText
	 * @param thisRequired
	 */
	function updateType( thisType, thisLabelText, thisRequired ) {
		try {
			const thisId = jQuery( '#fb-field-id' ).val();
			if ( ! thisType ) {
				thisType = jQuery( '#fb-new-type' ).val();
			}
			if ( ! thisLabelText ) {
				thisLabelText = jQuery( '#fb-new-field' + thisId + ' .label-text' ).text();
			}
			const isRequired = thisRequired
				? '<span class="label-required">' + GrunionFB_i18n.requiredLabel + '</span>'
				: '';
			const thisLabel =
				'<label fieldid="' +
				thisId +
				'" for="fb-field' +
				thisId +
				'"><span class="label-text">' +
				FB.esc_html( thisLabelText ) +
				'</span>' +
				isRequired +
				'</label>';
			const thisRadio =
				'<input type="radio" name="radio-' +
				thisId +
				'" id="fb-field' +
				thisId +
				' "disabled="disabled" />';
			const thisRadioLabel =
				'<label fieldid="' +
				thisId +
				'" for="fb-field' +
				thisId +
				'" class="fb-radio-label"><span class="label-text">' +
				FB.esc_html( thisLabelText ) +
				'</span>' +
				isRequired +
				'</label>';
			const thisRadioRemove = '<div class="fb-remove fb-remove-small" id="' + thisId + '"></div>';
			const thisRemove = '<div class="fb-remove" id="' + thisId + '"></div>';
			const thisCheckbox =
				'<input type="checkbox" id="fb-field' + thisId + '" "disabled="disabled" />';
			const thisCheckboxMultiple =
				'<input type="checkbox" id="fb-field' + thisId + '" "disabled="disabled" />';
			const thisCheckboxMultipleRemove =
				'<div class="fb-remove fb-remove-small" id="' + thisId + '"></div>';
			const thisText = '<input type="text" id="fb-field' + thisId + '" "disabled="disabled" />';
			const thisTextarea = '<textarea id="fb-field' + thisId + '" "disabled="disabled"></textarea>';
			const thisClear = '<div class="clear"></div>';
			const thisSelect =
				'<select id="fb-field' +
				thisId +
				'" fieldid="' +
				thisId +
				'"><option id="fb-' +
				thisId +
				'-' +
				optionsCount +
				'" value="' +
				thisId +
				'-' +
				optionsCount +
				'">' +
				GrunionFB_i18n.firstOptionLabel +
				'</option></select>';
			switch ( thisType ) {
				case 'checkbox':
					removeOptions();
					jQuery( '#fb-new-field' + thisId + ' .fb-fields' ).html(
						thisRadioRemove + thisCheckbox + thisRadioLabel + thisClear
					);
					break;
				case 'checkbox-multiple':
					jQuery( '#fb-new-field' + thisId + ' .fb-fields' ).html(
						thisLabel +
							thisCheckboxMultipleRemove +
							'<div fieldid="' +
							thisId +
							'" id="fb-custom-checkbox-multiple' +
							thisId +
							'"></div>'
					);
					if (
						optionsCache[ thisId ] !== undefined &&
						optionsCache[ thisId ].options.length !== 0
					) {
						fbForm.fields[ thisId ].options = optionsCache[ thisId ].options;
						jQuery( '#fb-custom-checkbox-multiple' + thisId ).append(
							customOptions( thisId, thisType )
						);
					} else {
						jQuery( '#fb-new-options' ).html(
							'<label for="fb-option0">' +
								GrunionFB_i18n.optionsLabel +
								'</label><input type="text" id="fb-option0" optionid="0" value="' +
								GrunionFB_i18n.firstOptionLabel +
								'" class="fb-options" />'
						);
						jQuery( '#fb-custom-checkbox-multiple' + thisId ).append(
							'<div id="fb-checkbox-multiple-' +
								thisId +
								'-0">' +
								thisCheckboxMultiple +
								'<span>' +
								GrunionFB_i18n.firstOptionLabel +
								'</span>' +
								thisClear +
								'</div>'
						);
						fbForm.fields[ thisId ].options[ optionsCount ] = GrunionFB_i18n.firstOptionLabel;
					}
					jQuery( '#fb-options' ).show();
					setTimeout( function () {
						jQuery( '#fb-option0' ).focus().select();
					}, 100 );
					break;
				case 'email':
					removeOptions();
					jQuery( '#fb-new-field' + thisId + ' .fb-fields' ).html(
						thisRemove + thisLabel + thisText
					);
					break;
				case 'name':
					removeOptions();
					jQuery( '#fb-new-field' + thisId + ' .fb-fields' ).html(
						thisRemove + thisLabel + thisText
					);
					break;
				case 'radio':
					jQuery( '#fb-new-field' + thisId + ' .fb-fields' ).html(
						thisLabel +
							thisRadioRemove +
							'<div fieldid="' +
							thisId +
							'" id="fb-custom-radio' +
							thisId +
							'"></div>'
					);
					if (
						optionsCache[ thisId ] !== undefined &&
						optionsCache[ thisId ].options.length !== 0
					) {
						fbForm.fields[ thisId ].options = optionsCache[ thisId ].options;
						jQuery( '#fb-custom-radio' + thisId ).append( customOptions( thisId, thisType ) );
					} else {
						jQuery( '#fb-new-options' ).html(
							'<label for="fb-option0">' +
								GrunionFB_i18n.optionsLabel +
								'</label><input type="text" id="fb-option0" optionid="0" value="' +
								GrunionFB_i18n.firstOptionLabel +
								'" class="fb-options" />'
						);
						jQuery( '#fb-custom-radio' + thisId ).append(
							'<div id="fb-radio-' +
								thisId +
								'-0">' +
								thisRadio +
								'<span>' +
								GrunionFB_i18n.firstOptionLabel +
								'</span>' +
								thisClear +
								'</div>'
						);
						fbForm.fields[ thisId ].options[ optionsCount ] = GrunionFB_i18n.firstOptionLabel;
					}
					jQuery( '#fb-options' ).show();
					setTimeout( function () {
						jQuery( '#fb-option0' ).focus().select();
					}, 100 );
					break;
				case 'select':
					jQuery( '#fb-new-field' + thisId + ' .fb-fields' ).html(
						thisRemove + thisLabel + thisSelect
					);
					if (
						optionsCache[ thisId ] !== undefined &&
						optionsCache[ thisId ].options.length !== 0
					) {
						fbForm.fields[ thisId ].options = optionsCache[ thisId ].options;
						jQuery( '#fb-field' + thisId ).html( customOptions( thisId, thisType ) );
					} else {
						jQuery( '#fb-new-options' ).html(
							'<label for="fb-option0">' +
								GrunionFB_i18n.optionsLabel +
								'</label><input type="text" id="fb-option0" optionid="0" value="' +
								GrunionFB_i18n.firstOptionLabel +
								'" class="fb-options" />'
						);
						fbForm.fields[ thisId ].options[ optionsCount ] = GrunionFB_i18n.firstOptionLabel;
					}
					jQuery( '#fb-options' ).show();
					setTimeout( function () {
						jQuery( '#fb-option0' ).focus().select();
					}, 100 );
					break;
				case 'text':
					removeOptions();
					jQuery( '#fb-new-field' + thisId + ' .fb-fields' ).html(
						thisRemove + thisLabel + thisText
					);
					break;
				case 'textarea':
					removeOptions();
					jQuery( '#fb-new-field' + thisId + ' .fb-fields' ).html(
						thisRemove + thisLabel + thisTextarea
					);
					break;
				case 'url':
					removeOptions();
					jQuery( '#fb-new-field' + thisId + ' .fb-fields' ).html(
						thisRemove + thisLabel + thisText
					);
					break;
			}
			// update object
			fbForm.fields[ thisId ].type = thisType;
		} catch ( e ) {
			if ( debug ) {
				// eslint-disable-next-line no-console
				console.log( 'updateType(): ' + e );
			}
		}
	}
	return {
		resizePop: function () {
			try {
				//Thickbox won't resize for some reason, we are manually doing it here
				const totalWidth = jQuery( 'body', window.parent.document ).width();
				const totalHeight = jQuery( 'body', window.parent.document ).height();
				const isIE6 = typeof document.body.style.maxHeight === 'undefined';

				jQuery( '#TB_window, #TB_iframeContent', window.parent.document ).css( 'width', '768px' );
				jQuery( '#TB_window', window.parent.document ).css( {
					left: ( totalWidth - 768 ) / 2 + 'px',
					top: '23px',
					position: 'absolute',
					marginLeft: '0',
				} );
				if ( ! isIE6 ) {
					// take away IE6
					jQuery( '#TB_window, #TB_iframeContent', window.parent.document ).css(
						'height',
						totalHeight - 73 + 'px'
					);
				}
			} catch ( e ) {
				if ( debug ) {
					// eslint-disable-next-line no-console
					console.log( 'resizePop(): ' + e );
				}
			}
		},
		init: function () {
			// Scroll to top of page
			window.parent.scroll( 0, 0 );
			//Check for existing form data
			let contentSource;
			if (
				jQuery( '#edButtonPreview', window.parent.document ).hasClass( 'active' ) ||
				jQuery( '#wp-content-wrap', window.parent.document ).hasClass( 'tmce-active' )
			) {
				const win = window.dialogArguments || opener || parent || top;
				contentSource = win.tinyMCE.activeEditor.getContent();
			} else {
				contentSource = jQuery( '#content', window.parent.document ).val();
			}
			const data = {
				action: 'grunion_shortcode_to_json',
				_ajax_nonce: ajax_nonce_json,
				post_id: postId,
				content: contentSource,
			};

			const $doc = jQuery( document );

			jQuery.post( ajaxurl, data, function ( response ) {
				// Setup fbForm
				parseShortcode( jQuery.parseJSON( response ) );
				// Now build out the preview form
				buildPreview();
			} );
			// actions
			jQuery( '.fb-add-field' ).click( function () {
				addField();
				hideDesc();
				return false;
			} );
			jQuery( '#fb-new-label' ).keyup( function () {
				updateLabel();
			} );
			jQuery( '#fb-new-type' ).change( function () {
				updateType();
			} );
			jQuery( '#fb-new-required' ).click( function () {
				updateRequired();
			} );
			$doc.on( 'click', '.fb-remove', function () {
				showDesc();
				deleteField( jQuery( this ) );
				grabShortcode();
			} );
			jQuery( '#fb-preview' ).submit( function () {
				sendShortcodeToEditor();
				return false;
			} );
			jQuery( '#TB_overlay, #TB_closeWindowButton', window.parent.document ).mousedown(
				function () {
					if ( confirm( GrunionFB_i18n.exitConfirmMessage ) ) {
						hidePopup();
					}
				}
			);
			$doc.on( 'click', '#fb-another-option', function () {
				addOption();
			} );
			$doc.on( 'keyup', '.fb-options', function () {
				updateOption( jQuery( this ) );
			} );
			$doc.on( 'click', '.fb-remove-option', function () {
				removeOption( jQuery( this ).attr( 'optionid' ) );
			} );
			jQuery( '#tab-preview a' ).click( function () {
				switchTabs( 'preview' );
				return false;
			} );
			jQuery( '#fb-prev-form' ).click( function () {
				switchTabs( 'preview' );
				return false;
			} );
			jQuery( '#tab-settings a' ).click( function () {
				switchTabs();
				return false;
			} );
			jQuery( '#fb-field-my-email' ).blur( function () {
				updateMyEmail();
			} );
			jQuery( '#fb-field-subject' ).blur( function () {
				updateSubject();
			} );
			$doc.on( 'mouseenter', '.fb-form-case .fb-new-fields', function () {
				hideShowEditLink( 'show', jQuery( this ) );
			} );
			$doc.on( 'mouseleave', '.fb-form-case .fb-new-fields', function () {
				hideShowEditLink( 'hide' );
				return false;
			} );
			$doc.on( 'click', '.fb-edit-field', function () {
				editField( jQuery( this ) );
				return false;
			} );
			$doc.on( 'click', '.fb-edit-field .fb-reorder', function () {
				return false;
			} );
			$doc.on( 'click', '#fb-save-field', function () {
				showDesc();
				showAndHideMessage();
				return false;
			} );
			jQuery( '#fb-feedback' ).click( function () {
				const thisHref = jQuery( this ).attr( 'href' );
				window.parent.location = thisHref;
				return false;
			} );
			jQuery( '#sortable' ).sortable( {
				axis: 'y',
				handle: '.fb-reorder',
				revert: true,
				start: function () {
					jQuery( '.fb-edit-field' ).hide();
				},
			} );
			jQuery( '#draggable' ).draggable( {
				axis: 'y',
				handle: '.fb-reorder',
				connectToSortable: '#sortable',
				helper: 'clone',
				revert: 'invalid',
			} );
		},
	};
} )();
