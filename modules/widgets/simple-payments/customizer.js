/* global jQuery, jpSimplePaymentsStrings */
/* eslint no-var: 0, quote-props: 0 */

( function( api, wp, $ ) {
	var $document = $( document );

	$document.ready( function() {
		$document.on( 'widget-added', function( event, widgetContainer ) {
			if ( widgetContainer.is( '[id*="jetpack_simple_payments_widget"]' ) ) {
				initWidget( widgetContainer );
			}
		} );

		$document.on( 'widget-synced widget-updated', function( event, widgetContainer ) {
			//this fires for all widgets, this prevent errors for non SP widgets
			if ( ! widgetContainer.is( '[id*="jetpack_simple_payments_widget"]' ) ) {
				return;
			}

			event.preventDefault();
			var widgetForm = widgetContainer.find( '> .widget-inside > .form, > .widget-inside > form' );

			if ( ! widgetForm.find( '.jetpack-simple-payments-form' ).is( ':visible' ) ) {
				widgetForm.find( '.jetpack-simple-payments-add-product' )
					.add( '.jetpack-simple-payments-edit-product' )
					.add( '.jetpack-simple-payments-products' )
					.removeAttr( 'disabled' );
			} else {
				widgetForm.find( '.jetpack-simple-payments-save-product' )
					.add( '.jetpack-simple-payments-cancel-form' )
					.add( '.jetpack-simple-payments-delete-product' )
					.removeAttr( 'disabled' );
			}

			var newImageId = parseInt( widgetForm.find( '.jetpack-simple-payments-form-image-id' ).val(), 10 );
			var newImageSrc = widgetForm.find( '.jetpack-simple-payments-form-image-src' ).val();

			var placeholder = widgetForm.find( '.jetpack-simple-payments-image-fieldset .placeholder' );
			var image = widgetForm.find( '.jetpack-simple-payments-image > img' );
			var imageControls = widgetForm.find( '.jetpack-simple-payments-image' );

			if ( newImageId && newImageSrc ) {
				image.attr( 'src', newImageSrc );
				placeholder.hide();
				imageControls.show();
			} else {
				placeholder.show();
				image.removeAttr( 'src' );
				imageControls.hide();
			}
		} );
	} );

	function initWidget( widgetContainer ) {
		var widgetForm = widgetContainer.find( '> .widget-inside > .form, > .widget-inside > form' );

		//Add New Button
		widgetForm.find( '.jetpack-simple-payments-add-product' ).on( 'click', showAddNewForm( widgetForm ) );
		//Edit Button
		widgetForm.find( '.jetpack-simple-payments-edit-product' ).on( 'click', showEditForm( widgetForm ) );
		//Select an Image
		widgetForm.find( '.jetpack-simple-payments-image-fieldset .placeholder, .jetpack-simple-payments-image > img' ).on( 'click', selectImage( widgetForm ) );
		//Remove Image Button
		widgetForm.find( '.jetpack-simple-payments-remove-image' ).on( 'click', removeImage( widgetForm ) );
		//Save Product button
		widgetForm.find( '.jetpack-simple-payments-save-product' ).on( 'click', saveChanges( widgetForm ) );
		//Cancel Button
		widgetForm.find( '.jetpack-simple-payments-cancel-form' ).on( 'click', clearForm( widgetForm ) );
		//Delete Selected Product
		widgetForm.find( '.jetpack-simple-payments-delete-product' ).on( 'click', deleteProduct( widgetForm ) );
	}

	function showForm( widgetForm ) {
		//disable widget title and product selector
		widgetForm.find( '.jetpack-simple-payments-widget-title' ).attr( 'disabled', 'disabled' );
		widgetForm.find( '.jetpack-simple-payments-products' ).attr( 'disabled', 'disabled' );
		//disable add and edit buttons
		widgetForm.find( '.jetpack-simple-payments-add-product' ).attr( 'disabled', 'disabled' );
		widgetForm.find( '.jetpack-simple-payments-edit-product' ).attr( 'disabled', 'disabled' );
		//disable save, delete and cancel until the widget update event is fired
		widgetForm.find( '.jetpack-simple-payments-save-product' )
			.add( '.jetpack-simple-payments-cancel-form' )
			.add( '.jetpack-simple-payments-delete-product' )
			.attr( 'disabled', 'disabled' );
		//show form
		widgetForm.find( '.jetpack-simple-payments-form' ).show();
	}

	function hideForm( widgetForm ) {
		//enable widget title and product selector
		widgetForm.find( '.jetpack-simple-payments-widget-title' ).removeAttr( 'disabled' );
		widgetForm.find( '.jetpack-simple-payments-products' ).removeAttr( 'disabled' );
		//endable add and edit buttons
		widgetForm.find( '.jetpack-simple-payments-add-product' ).removeAttr( 'disabled' );
		widgetForm.find( '.jetpack-simple-payments-edit-product' ).removeAttr( 'disabled' );
		//hide the form
		widgetForm.find( '.jetpack-simple-payments-form' ).hide();
	}

	function changeFormAction( widgetForm, action ) {
		widgetForm.find( '.jetpack-simple-payments-form-action' ).val( action ).change();
	}

	function showAddNewForm( widgetForm ) {
		return function( event ) {
			event.preventDefault();

			showForm( widgetForm );

			changeFormAction( widgetForm, 'add' );
		};
	}

	function showEditForm( widgetForm ) {
		return function( event ) {
			event.preventDefault();

			showForm( widgetForm );

			changeFormAction( widgetForm, 'edit' );
		};
	}

	function clearForm( widgetForm ) {
		return function( event ) {
			event.preventDefault();

			hideForm( widgetForm );

			widgetForm.find( '.jetpack-simple-payments-add-product, .jetpack-simple-payments-edit-product' ).attr( 'disabled', 'disabled' );

			changeFormAction( widgetForm, 'clear' );
		};
	}

	function selectImage( widgetForm ) {
		return function( event ) {
			event.preventDefault();

			var imageContainer = widgetForm.find( '.jetpack-simple-payments-image' );

			var mediaFrame = new wp.media.view.MediaFrame.Select( {
				title: 'Choose Product Image',
				multiple: false,
				library: { type: 'image' },
				button: { text: 'Choose Image' },
			} );

			mediaFrame.on( 'select', function() {
				var selection = mediaFrame.state().get( 'selection' ).first().toJSON();
				//hide placeholder
				widgetForm.find( '.jetpack-simple-payments-image-fieldset .placeholder' ).hide();

				//load image from media library
				imageContainer.find( 'img' )
					.attr( 'src', selection.url )
					.show();

				//show image and remove button
				widgetForm.find( '.jetpack-simple-payments-image' ).show();

				//set hidden field for the selective refresh
				widgetForm.find( '.jetpack-simple-payments-form-image-id' ).val( selection.id ).change();
			} );

			mediaFrame.open();
		};
	}

	function removeImage( widgetForm ) {
		return function( event ) {
			event.preventDefault();

			//show placeholder
			widgetForm.find( '.jetpack-simple-payments-image-fieldset .placeholder' ).show();

			//hide image and remove button
			widgetForm.find( '.jetpack-simple-payments-image' ).hide();

			//set hidden field for the selective refresh
			widgetForm.find( '.jetpack-simple-payments-form-image-id' ).val( '' ).change();
		};
	}

	function saveChanges( widgetForm ) {
		return function( event ) {
			event.preventDefault();
			var productPostId = widgetForm.find( '.jetpack-simple-payments-form-product-id' ).val();

			var request = wp.ajax.post( 'customize-jetpack-simple-payments-button-save', {
				'customize-jetpack-simple-payments-nonce': api.settings.nonce[ 'customize-jetpack-simple-payments' ],
				'customize_changeset_uuid': api.settings.changeset.uuid,
				'params': {
					'product_post_id': productPostId,
					'post_title': widgetForm.find( '.jetpack-simple-payments-form-product-title' ).val(),
					'post_content': widgetForm.find( '.jetpack-simple-payments-form-product-description' ).val(),
					'image_id': widgetForm.find( '.jetpack-simple-payments-form-image-id' ).val(),
					'currency': widgetForm.find( '.jetpack-simple-payments-form-product-currency' ).val(),
					'price': widgetForm.find( '.jetpack-simple-payments-form-product-price' ).val(),
					'multiple': widgetForm.find( '.jetpack-simple-payments-form-product-multiple' ).is( ':checked' ) ? 1 : 0,
					'email': widgetForm.find( '.jetpack-simple-payments-form-product-email' ).val(),
				}
			} );

			request.done( function( response ) {
				var select = widgetForm.find( 'select.jetpack-simple-payments-products' );
				var productOption = select.find( 'option[value="' + productPostId + '"]' );

				if ( productOption.length > 0	) {
					productOption.text( response.product_post_title );
				} else {
					select.append(
						$( '<option>', {
							value: response.product_post_id,
							text: response.product_post_title
						} )
					);
					select.val( response.product_post_id ).change();
				}
				changeFormAction( widgetForm, 'clear' );
				hideForm( widgetForm );
			} );
		};
	}

	function deleteProduct( widgetForm ) {
		return function( event ) {
			event.preventDefault();

			if ( ! confirm( jpSimplePaymentsStrings.deleteConfirmation ) ) {
				return;
			}

			var formProductId = parseInt( widgetForm.find( '.jetpack-simple-payments-form-product-id' ).val(), 10 );
			if ( ! formProductId ) {
				return;
			}

			var request = wp.ajax.post( 'customize-jetpack-simple-payments-button-delete', {
				'customize-jetpack-simple-payments-nonce': api.settings.nonce[ 'customize-jetpack-simple-payments' ],
				'customize_changeset_uuid': api.settings.changeset.uuid,
				'params': {
					'product_post_id': formProductId
				}
			} );

			request.done( function() {
				var productList = widgetForm.find( 'select.jetpack-simple-payments-products' )[ 0 ];
				productList.remove( productList.selectedIndex );
				productList.dispatchEvent( new Event( 'change' ) );
				changeFormAction( widgetForm, 'clear' );
				hideForm( widgetForm );
			} );
		};
	}
}( wp.customize, wp, jQuery ) );
