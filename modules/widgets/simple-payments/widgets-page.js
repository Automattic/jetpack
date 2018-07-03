/* global wp, jetpackSimplePaymentsWidget */
/* eslint no-var: 0, no-console: 0 */

( function( $ ) {
	// ELEMENTS CLASSES
	var productsSelector = '.jetpack-simple-payments-products';
	var buttons = {
		addProduct: '.jetpack-simple-payments-add-product',
		editProduct: '.jetpack-simple-payments-edit-product',
		deleteProduct: '.jetpack-simple-payments-delete-product',
		saveProduct: '.jetpack-simple-payments-save-product',
		selectImage: '.jetpack-simple-payments-select-image',
		removeImage: '.jetpack-simple-payments-remove-image',
		cancelForm: '.jetpack-simple-payments-cancel-form',
	};
	var productForm = {
		title: '.jetpack-simple-payments-form-product-title',
		description: '.jetpack-simple-payments-form-product-description',
		image: '.jetpack-simple-payments-image',
		imagePlaceholder: '.jetpack-simple-payments-image-fieldset .placeholder',
		currency: '.jetpack-simple-payments-form-product-currency',
		price: '.jetpack-simple-payments-form-product-price',
		multiple: '.jetpack-simple-payments-form-product-multiple',
		email: '.jetpack-simple-payments-form-product-email',
	};

	var nonce = jetpackSimplePaymentsWidget.nonce;
	//var strings = jetpackSimplePaymentsWidget.strings;
	var $widgetsArea = $( '#widgets-right' );

	// Get the widget parent context of an element.
	function getWidgetContainer( $element ) {
		return $element.closest( '.jetpack-simple-payments-widget-container' );
	}

	// Get the product form parent context of an element.
	function getForm( $element ) {
		var $widget = getWidgetContainer( $element );
		return $( '.jetpack-simple-payments-form', $widget );
	}

	// Get the values of a product form.
	function getFormValues( $form ) {
		var values = {
			id: 0,
			title: $( productForm.title, $form ).val(),
			description: $( productForm.description, $form ).val(),
			imageId: $( productForm.image, $form ).data( 'image-id' ),
			currency: $( productForm.currency, $form ).val(),
			price: $( productForm.price, $form ).val(),
			multiple: $( productForm.multiple, $form ).is( ':checked' ) ? 1 : 0,
			email: $( productForm.email, $form ).val(),
		};
		return values;
	}

	// Set the values of a product form.
	function setFormValues( $form, values ) {
		$( productForm.title, $form ).val( values.title );
		$( productForm.description, $form ).val( values.description );
		$( productForm.currency, $form ).val( values.currency );
		$( productForm.price, $form ).val( values.price );
		$( productForm.multiple, $form ).prop( 'checked', !! values.multiple );
		$( productForm.email, $form ).val( values.email );

		if ( !! values.image_id && !! values.image_src ) {
			var $imageContainer = $( productForm.image, $form );

			$( productForm.imagePlaceholder, $form ).hide();
			$( 'img', $imageContainer ).prop( 'src', values.image_src );
			$imageContainer.data( 'image-id', values.image_id );
			$imageContainer.show();
		}
	}

	// Update the products selector by adding, removing, or changing one of its values.
	function updateSelector( $widget, action, data ) {
		var $selector = $( productsSelector, $widget );

		switch ( action ) {
			case 'create':
				$selector.append(
					$( '<option>', {
						text: data.product_post_title,
						value: data.product_post_id,
					} )
				);
				$selector.val( data.product_post_id ).change();
				break;
			case 'update':
				break;
			case 'delete':
				break;
		}
	}

	// Clear the image of a product form.
	function clearFormImage( $form ) {
		var $imageContainer = $( productForm.image, $form );

		$( productForm.imagePlaceholder, $form ).show();
		$imageContainer.data( 'image-id', 0 );
		$imageContainer.hide();
	}

	// Clear a product form.
	function clearForm( $form ) {
		$( 'input[type="text"], textarea', $form ).val( '' );
		$( 'input[type="checkbox"]', $form ).prop( 'checked', false );
		$( 'option', $form ).prop( 'selected', false );
		clearFormImage( $form );
	}

	// Disable all fields of a widget.
	function disableWidget( $widget ) {
		$( 'button, input, select, textarea', $widget ).prop( 'disabled', true );
	}

	// Enable all fields of a widget.
	function enableWidget( $widget ) {
		$( 'button, input, select, textarea', $widget ).prop( 'disabled', false );
	}

	// Enable all fields of a form.
	function enableForm( $form ) {
		$( 'button, input, select, textarea', $form ).prop( 'disabled', false );
	}

	// Check if a product form's values are valid.
	function isFormValid( $form, values ) {
		$( '.invalid', $form ).removeClass( 'invalid' );
		var isValid = true;

		if ( ! values.title ) {
			$( productForm.title, $form ).addClass( 'invalid' );
			isValid = false;
		}

		if ( ! values.price || isNaN( parseFloat( values.price ) ) || parseFloat( values.price ) <= 0 ) {
			$( productForm.price, $form ).addClass( 'invalid' );
			isValid = false;
		}

		var isEmailValid = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test( values.email );
		if ( ! values.email || ! isEmailValid ) {
			$( productForm.email, $form ).addClass( 'invalid' );
			isValid = false;
		}

		return isValid;
	}

	// Show the Create Product form.
	$widgetsArea.on( 'click', buttons.addProduct, function( event ) {
		event.preventDefault();

		var $widget = getWidgetContainer( $( this ) );
		var $form = getForm( $( this ) );
		disableWidget( $widget );
		enableForm( $form );
		$form.show();
	} );

	// Fetch the selected product values, and show the Edit Product form.
	$widgetsArea.on( 'click', buttons.editProduct, function( event ) {
		event.preventDefault();

		var $widget = getWidgetContainer( $( this ) );
		var $form = getForm( $( this ) );
		disableWidget( $widget );

		var productId = $( productsSelector, $widget ).val();
		var request = wp.ajax.post( 'customize-jetpack-simple-payments-button-get', {
			'customize-jetpack-simple-payments-nonce': nonce,
			params: {
				product_post_id: productId,
			},
		} );

		request.done( function( data ) {
			setFormValues( $form, data );
			$( buttons.deleteProduct, $form ).show();
			$form.show();
			enableForm( $form );
		} );

		request.fail( function() {
			enableWidget( $widget );
		} );
	} );

	// Save the values contained in a product form.
	$widgetsArea.on( 'click', buttons.saveProduct, function( event ) {
		event.preventDefault();

		var $widget = getWidgetContainer( $( this ) );
		var $form = getForm( $( this ) );
		var values = getFormValues( $form );

		if ( ! isFormValid( $form, values ) ) {
			return;
		}

		disableWidget( $widget );

		var request = wp.ajax.post( 'customize-jetpack-simple-payments-button-save', {
			'customize-jetpack-simple-payments-nonce': nonce,
			params: {
				product_post_id: values.id,
				post_title: values.title,
				post_content: values.description,
				image_id: values.imageId,
				currency: values.currency,
				price: values.price,
				multiple: values.multiple,
				email: values.email,
			},
		} );

		request.done( function( data ) {
			var action = !! values.id ? 'update' : 'create';
			updateSelector( $widget, action, data );
			enableWidget( $widget );
			$form.hide();
			clearForm( $form );
		} );

		request.fail( function( data ) {
			var validCodes = {
				post_title: 'title',
				price: 'price',
				email: 'email',
			};
			data.forEach( function( item ) {
				if ( validCodes.hasOwnProperty( item.code ) ) {
					$( '.jetpack-simple-payments-form-product-' + validCodes[ item.code ], $form ).addClass( 'invalid' );
				}
			} );
			enableForm( $form );
		} );
	} );

	// Open a Media Library dialog.
	$widgetsArea.on( 'click', buttons.selectImage, function( event ) {
		event.preventDefault();

		var $form = getForm( $( this ) );
		var $imageContainer = $( productForm.image, $form );

		var mediaFrame = new wp.media.view.MediaFrame.Select( {
			title: 'Choose Product Image',
			multiple: false,
			library: { type: 'image' },
			button: { text: 'Choose Image' }
		} );

		mediaFrame.on( 'select', function() {
			var selection = mediaFrame.state().get( 'selection' ).first().toJSON();

			$( productForm.imagePlaceholder, $form ).hide();
			$( 'img', $imageContainer ).prop( 'src', selection.url );
			$imageContainer.data( 'image-id', selection.id );
			$imageContainer.show();
		} );

		mediaFrame.open();
	} );

	// Remove a selected image.
	$widgetsArea.on( 'click', buttons.removeImage, function( event ) {
		event.preventDefault();
		var $form = getForm( $( this ) );
		clearFormImage( $form );
	} );

	// Close a product form and clear its values.
	$widgetsArea.on( 'click', buttons.cancelForm, function( event ) {
		event.preventDefault();
		var $widget = getWidgetContainer( $( this ) );
		var $form = getForm( $( this ) );
		$form.hide();
		$( buttons.deleteProduct, $form ).hide();
		clearForm( $form );
		enableWidget( $widget );
	} );
}( jQuery ) );
