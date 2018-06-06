( function( api, wp, $ ) {
	function getWidgetRoot() {
		return $( this ).closest( '.widget-content' );
	}

	function showForm() {
		var root = getWidgetRoot.apply( this );
		//disable widget title and product selector
		root.find( '.jetpack-simple-payments-widget-title' ).attr( 'disabled', 'disabled' );
		root.find( '.jetpack-simple-payments-products' ).attr( 'disabled', 'disabled' );
		//disable add and edit buttons
		root.find( '.jetpack-simple-payments-add-product' ).attr( 'disabled', 'disabled' );
		root.find( '.jetpack-simple-payments-edit-product' ).attr( 'disabled', 'disabled' );
		//show form
		root.find( '.jetpack-simple-payments-form' ).show();
		//focus on first field
		root.find( '.jetpack-simple-payments-form-product-title').focus();
	}

	function hideForm() {
		var root = getWidgetRoot.apply( this );
		//enable widget title and product selector
		root.find( '.jetpack-simple-payments-widget-title' ).removeAttr( 'disabled' );
		root.find( '.jetpack-simple-payments-products' ).removeAttr( 'disabled' );
		//endable add and edit buttons
		root.find( '.jetpack-simple-payments-add-product' ).removeAttr( 'disabled' );
		root.find( '.jetpack-simple-payments-edit-product' ).removeAttr( 'disabled' );
		//hide the form
		root.find( '.jetpack-simple-payments-form' ).hide();
	}

	function changeFormAction( action ) {
		var root = getWidgetRoot.apply( this );
		root.find( '.jetpack-simple-payments-form-action' ).val( action ).change();
	}

	$( document ).ready( function() {
		//Add New Button
		$( document.body ).on( 'click', '.jetpack-simple-payments-add-product', function( event ) {
			event.preventDefault();

			showForm.apply( this );

			changeFormAction.apply( this, [ 'add' ] );
		} );

		//Edit Button
		$( document.body ).on( 'click', '.jetpack-simple-payments-edit-product', function( event ) {
			event.preventDefault();

			showForm.apply( this );

			changeFormAction.apply( this, [ 'edit' ] );
		} );

		//Cancel Button
		$( document.body ).on( 'click', '.jetpack-simple-payments-cancel-form', function( event ) {
			event.preventDefault();

			hideForm.apply( this );

			changeFormAction.apply( this, [ 'clear' ] );
		} );

		//Save Product button
		$( document.body ).on( 'click', '.jetpack-simple-payments-save-product', function( event ) {
			event.preventDefault();
			var root = getWidgetRoot.apply( this );
			var clearForm = changeFormAction.bind( this );
			var hide = hideForm.bind( this );

			request = wp.ajax.post( 'customize-jetpack-simple-payments-button-add-new', {
				'customize-jetpack-simple-payments-nonce': api.settings.nonce['customize-jetpack-simple-payments'],
				'customize_changeset_uuid': api.settings.changeset.uuid,
				'params': { 
					'title': root.find( '.jetpack-simple-payments-form-product-title' ).val(),
					'description': root.find( '.jetpack-simple-payments-form-product-description' ).val(),
					'image_id': root.find( '.jetpack-simple-payments-form-image-id' ).val(),
					'currency': root.find( '.jetpack-simple-payments-form-product-currency' ).val(),
					'price': root.find( '.jetpack-simple-payments-form-product-price' ).val(),
					'multiple': root.find( '.jetpack-simple-payments-form-product-multiple' ).is(':checked'),
					'email': root.find( '.jetpack-simple-payments-form-product-email' ).val(),
				}
			} );

			request.done( function( response ) {
				var select = root.find( 'select.jetpack-simple-payments-products' ).append(
					$('<option>', {
						value: response.product_post_id,
						text: response.product_post_title
					} )
				);
				select.val( response.product_post_id ).change();
				clearForm( 'clear' );
				hide();
			} );
		} );

		//Select an Image
		$( document.body ).on( 'click', '.jetpack-simple-payments-image-fieldset .placeholder, .jetpack-simple-payments-image > img', function() {
			var root = getWidgetRoot.apply( this );
			var imageContainer = root.find( '.jetpack-simple-payments-image' );

			var mediaFrame = new wp.media.view.MediaFrame.Select( {
				title: 'Choose Product Image',
				multiple: false,
				library: { type: 'image' },
				button: { text: 'Choose Image' },
			} );

			mediaFrame.on( 'select', function() {
				var selection = mediaFrame.state().get( 'selection' ).first().toJSON();
				//hide placeholder
				root.find( '.jetpack-simple-payments-image-fieldset .placeholder' ).hide();

				//load image from media library
				imageContainer.find( 'img' )
					.attr( 'src', selection.url )
					.show();

				//show image and remove button
				root.find( '.jetpack-simple-payments-image' ).show();

				//set hidden field for the selective refresh
				root.find( '.jetpack-simple-payments-form-image-id' ).val( selection.id ).change();
			} );

			mediaFrame.open();
		} );

		//Remove Image
		$( document.body ).on( 'click', '.jetpack-simple-payments-remove-image', function( event ) {
			event.preventDefault();
			var root = getWidgetRoot.apply( this );

			//show placeholder
			root.find( '.jetpack-simple-payments-image-fieldset .placeholder' ).show();

			//hide image and remove button
			root.find( '.jetpack-simple-payments-image' ).hide();

			//set hidden field for the selective refresh
			root.find( '.jetpack-simple-payments-form-image-id' ).val( '' ).change();
		} );
	} );
}( wp.customize, wp, jQuery ) );
