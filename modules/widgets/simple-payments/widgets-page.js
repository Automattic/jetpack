/* global wp, jetpackSimplePaymentsWidget */
/* eslint no-var: 0 */

( function( $ ) {
	var nonce = jetpackSimplePaymentsWidget.nonce;
	//var strings = jetpackSimplePaymentsWidget.strings;
	var $widgetsArea = $( '#widgets-right' );

	function getWidgetContainer( $element ) {
		return $element.closest( '.jetpack-simple-payments-widget-container' );
	}

	function getForm( $element ) {
		var $widget = getWidgetContainer( $element );
		return $( '.jetpack-simple-payments-widget-form', $widget );
	}

	function getFormValues( $form ) {
		var values = {
			id: 0,
			title: $( '.jetpack-simple-payments-widget-form-product-title', $form ).val(),
			content: '',
			imageId: 0,
			currency: 'USD',
			price: '1',
			multiple: 0,
			email: 'example@example.org',
		};
		return values;
	}

	function updateSelector( $widget, action, data ) {
		var $selector = $( '.jetpack-simple-payments-products', $widget );

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

	function clearForm( $form ) {
		$( 'input', $form ).val( '' );
	}

	function disableWidget( $widget ) {
		$( 'button, input', $widget ).prop( 'disabled', true );
	}

	function enableWidget( $widget ) {
		$( 'button, input', $widget ).prop( 'disabled', false );
	}

	$widgetsArea.on( 'click', '.jetpack-simple-payments-add-product', function( event ) {
		event.preventDefault();

		var $form = getForm( $( this ) );
		$form.show();
	} );

	$widgetsArea.on( 'click', '.jetpack-simple-payments-edit-product', function( event ) {
		event.preventDefault();

		var $form = getForm( $( this ) );
		$form.show();
	} );

	$widgetsArea.on( 'click', '.jetpack-simple-payments-save-product', function( event ) {
		event.preventDefault();

		var $widget = getWidgetContainer( $( this ) );
		disableWidget( $widget );

		var $form = getForm( $( this ) );
		var values = getFormValues( $form );

		var request = wp.ajax.post( 'customize-jetpack-simple-payments-button-save', {
			'customize-jetpack-simple-payments-nonce': nonce,
			params: {
				product_post_id: values.id,
				post_title: values.title,
				post_content: values.content,
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
			enableWidget( $widget );
		} );
	} );

	$widgetsArea.on( 'click', '.jetpack-simple-payments-cancel-form', function( event ) {
		event.preventDefault();

		var $form = getForm( $( this ) );
		$form.hide();
		clearForm( $form );
	} );
}( jQuery ) );
