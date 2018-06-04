( function( $ ) {
	function showEditProductForm( root, values ) {
		if ( ! values ) {
			values = {
				name: root.find( '.field-name' ).prop( 'defaultValue' ),
				description: root.find( '.field-description' ).prop( 'defaultValue' ),
				currency: root.find( '.field-currency' ).find( 'option' ).filter( function() {
					return $( this ).prop( 'defaultSelected' );
				} ).val(),
				price: root.find( '.field-price' ).prop( 'defaultValue' ),
				multiple: root.find( '.field-multiple' ).prop( 'defaultChecked' ),
				email: root.find( '.field-email' ).prop( 'defaultValue' )
			};
		}
		root.find( '.simple-payments-back-product-list' ).show();
		root.find( '.simple-payments-product-list' ).hide();

		root.find( '.simple-payments-form' ).show();
		root.find( '.field-name' ).prop( 'disabled', false ).val( values.name );
		root.find( '.field-description' ).val( values.description );
		root.find( '.field-currency' ).val( values.currency );
		root.find( '.field-price' ).val( values.price );
		root.find( '.field-multiple' ).prop( 'checked', values.multiple );
		root.find( '.field-email' ).val( values.email );

		var imageContainer = root.find( '.simple-payments-image' );
		imageContainer.find( 'img, input[type=hidden]' ).remove();
		if ( values.image ) {
			root.find( '.simple-payments-image-fieldset .placeholder' ).hide();
			imageContainer.show()
				.append( $( '<img/>', {
					src: values.image
				} ) )
				.append( $( '<input/>', {
					type: 'hidden',
					name: imageContainer.data( 'image-field' ),
					value: values.image
				} ) );
		} else {
			root.find( '.simple-payments-image-fieldset .placeholder' ).show();
		}
	}

	$( document ).ready( function() {
		// Open the "Add new product" view
		$( document.body ).on( 'click', '.simple-payments-add-product', function( event ) {
			event.preventDefault();
			var root = $( this ).closest( '.simple-payments' );
			root.find( '.simple-payments-product-list input[type="radio"]' ).prop( 'checked', false );

			showEditProductForm( root );
		} );

		// Open the "Edit product" view
		$( document.body ).on( 'click', '.simple-payments-edit-product', function( event ) {
			event.preventDefault();
			$( this ).closest( 'li' ).find( 'input[type="radio"]' ).click();
			var root = $( this ).closest( '.simple-payments' );

			showEditProductForm( root, {
				name: $( this ).data( 'name' ),
				description: $( this ).data( 'description' ),
				currency: $( this ).data( 'currency' ),
				price: $( this ).data( 'price' ),
				multiple: String( $( this ).data( 'multiple' ) ) === '1',
				email: $( this ).data( 'email' ),
				image: $( this ).data( 'image-url' )
			} );
		} );

		// "Back" link that cancels the changes on the Product currently being edited/added
		$( document.body ).on( 'click', '.simple-payments-back-product-list', function( event ) {
			event.preventDefault();
			$( this ).hide();
			var root = $( this ).closest( '.simple-payments' );
			root.find( '.simple-payments-form' ).hide()
				.find( '.field-name' ).prop( 'disabled', true );
			root.find( '.simple-payments-product-list' ).show();
		} );

		// When the user clicks the "x" button in the Product image, remove the image value and restore the placeholder
		$( document.body ).on( 'click', '.simple-payments-remove-image', function( event ) {
			event.preventDefault();
			var root = $( this ).closest( '.simple-payments-form' );
			var imageContainer = root.find( '.simple-payments-image' );
			root.find( '.simple-payments-image-fieldset .placeholder' ).show();
			imageContainer.find( 'img, input[type=hidden]' ).remove();
			imageContainer.hide();
		} );

		// Open the image picker when the user clicks on the Product image (or placeholder)
		$( document.body ).on( 'click', '.simple-payments-image-fieldset .placeholder, .simple-payments-image > img', function( event ) {
			var root = $( this ).closest( '.simple-payments-form' );
			var imageContainer = root.find( '.simple-payments-image' );

			event.preventDefault();
			var frame = new wp.media.view.MediaFrame.Select( {
				title: 'Choose Product Image', // TODO: i18n
				multiple: false,
				library: {
					type: 'image'
				},
				button: {
					text: 'Choose Image' // TODO: i18n
				}
			} );

			// Fires when a user has selected attachment(s) and clicked the select button.
			// @see media.view.MediaFrame.Post.mainInsertToolbar()
			frame.on( 'select', function() {
				var selection = frame.state().get( 'selection' ).first().toJSON();

				if ( 0 > $.trim( selection.url.length ) ) {
					return;
				}

				root.find( '.simple-payments-image-fieldset .placeholder' ).hide();

				imageContainer.find( 'img, input[type=hidden]' ).remove();
				imageContainer.show()
					.append( $( '<img/>', {
						src: selection.url,
						alt: selection.caption,
						title: selection.title
					} ) )
					.append( $( '<input/>', {
						type: 'hidden',
						name: imageContainer.data( 'image-field' ),
						value: selection.id
					} ) );
			} );

			// Open the modal.
			frame.open();
		} );
	} );
} )( jQuery );
