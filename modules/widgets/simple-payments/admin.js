(function($) {
	$(document).ready( function() {
		$( document.body ).on( 'click', '.simple-payments-add-product', function( event ) {
			event.preventDefault();
			var root = $( this ).closest( '.simple-payments' );
			root.find( '.simple-payments-product-list input[type="radio"]' ).prop( 'checked', false );
			root.find( '.simple-payments-product-list' ).hide();

			var imageContainer = root.find( '.simple-payments-image' );
			imageContainer.find( 'img, input[type=hidden]' ).remove();
			root.find( '.simple-payments-form' ).show();
			root.find( '.simple-payments-image-fieldset .placeholder' ).show();
			root.find( '.field-name' ).prop( 'disabled', false ).val( root.find( '.field-name' ).prop( 'defaultValue' ) );
			root.find( '.field-description' ).val( root.find( '.field-description' ).prop( 'defaultValue' ) );
			root.find( '.field-currency' ).val( function() { // Reset the dropdown to the default value
				return $( this ).find( 'option' ).filter( function() {
					return $( this ).prop( 'defaultSelected' );
				} ).val();
			} );
			root.find( '.field-price' ).val( root.find( '.field-price' ).prop( 'defaultValue' ) );
			root.find( '.field-multiple' ).prop( 'checked', root.find( '.field-multiple' ).prop( 'defaultChecked' ) );
			root.find( '.field-email' ).val( root.find( '.field-email' ).prop( 'defaultValue' ) );

			if ( $( this ).data( 'image-url' ) ) {
				root.find( '.simple-payments-image-fieldset .placeholder' ).hide();
				imageContainer.show()
					.append( $( '<img/>', {
						src: $( this ).data( 'image-url' ),
					} ) )
					.append( $( '<input/>', {
						type: 'hidden',
						name: imageContainer.data( 'image-field' ),
						value: $( this ).data( 'image-url' ),
					} ) );
			} else {
				root.find( '.simple-payments-image-fieldset .placeholder' ).show();
			}
		} );

		$( document.body ).on( 'click', '.simple-payments-edit-product', function( event ) {
			event.preventDefault();
			$( this ).closest( 'label' ).click();
			var root = $( this ).closest( '.simple-payments' );
			root.find( '.simple-payments-product-list' ).hide();
			var imageContainer = root.find( '.simple-payments-image' );
			imageContainer.find( 'img, input[type=hidden]' ).remove();

			root.find( '.simple-payments-form' ).show();
			root.find( '.field-name' ).prop( 'disabled', false ).val( $( this ).data( 'name' ) );
			root.find( '.field-description' ).val( $( this ).data( 'description' ) );
			root.find( '.field-currency' ).val( $( this ).data( 'currency' ) );
			root.find( '.field-price' ).val( $( this ).data( 'price' ) );
			root.find( '.field-multiple' ).prop( 'checked', String( $( this ).data( 'multiple' ) ) === '1' );
			root.find( '.field-email' ).val( $( this ).data( 'email' ) );

			if ( $( this ).data( 'image-url' ) ) {
				root.find( '.simple-payments-image-fieldset .placeholder' ).hide();
				imageContainer.show()
					.append( $( '<img/>', {
						src: $( this ).data( 'image-url' ),
					} ) )
					.append( $( '<input/>', {
						type: 'hidden',
						name: imageContainer.data( 'image-field' ),
						value: $( this ).data( 'image-url' ),
					} ) );
			} else {
				root.find( '.simple-payments-image-fieldset .placeholder' ).show();
			}
		} );

		$( document.body ).on( 'click', '.simple-payments-back-product-list', function( event ) {
			event.preventDefault();
			var root = $( this ).closest( '.simple-payments' );
			root.find( '.simple-payments-form' ).hide()
				.find( '.field-name' ).prop( 'disabled', true );
			root.find( '.simple-payments-product-list' ).show();
		} );

		$( document.body ).on( 'click', '.simple-payments-remove-image', function( event ) {
			event.preventDefault();
			var root = $( this ).closest( '.simple-payments-form' );
			var imageContainer = root.find( '.simple-payments-image' );
			root.find( '.simple-payments-image-fieldset .placeholder' ).show();
			imageContainer.find( 'img, input[type=hidden]' ).remove();
			imageContainer.hide();
		} );

		$( document.body ).on( 'click', '.simple-payments-image-fieldset .placeholder, .simple-payments-image > img', function( event ) {
			var root = $( this ).closest( '.simple-payments-form' );
			var imageContainer = root.find( '.simple-payments-image' );

			event.preventDefault();
			var frame = new wp.media.view.MediaFrame.Select({
				title: 'Choose Product Image', // TODO: i18n

				// Enable/disable multiple select
				multiple: false,

				// Library WordPress query arguments.
				library: {
					type: 'image',
				},

				button: {
					text: 'Choose Image'
				}
			});

			// Fires when a user has selected attachment(s) and clicked the select button.
			// @see media.view.MediaFrame.Post.mainInsertToolbar()
			frame.on( 'select', function() {
				var selection = frame.state().get('selection').first().toJSON();

				// First, make sure that we have the URL of an image to display
				if ( 0 > $.trim( selection.url.length ) ) {
					return;
				}

				root.find( '.simple-payments-image-fieldset .placeholder' ).hide();

				imageContainer.find( 'img, input[type=hidden]' ).remove();
				imageContainer.show()
					.append( $( '<img/>', {
						src: selection.url,
						alt: selection.caption,
						title: selection.title,
					} ) )
					.append( $( '<input/>', {
						type: 'hidden',
						name: imageContainer.data( 'image-field' ),
						value: selection.id,
					} ) );


			} );

			// Open the modal.
			frame.open();
		});
	});
})(jQuery);
