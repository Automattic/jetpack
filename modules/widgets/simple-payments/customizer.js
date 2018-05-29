( function( api, wp, $ ) {
	function getWidgetRoot() {
		return $( this ).closest( '.widget-content' );
	}

	function showForm() {
		var root = getWidgetRoot.apply( this );
		root.find( '.jetpack-simple-payments-widget-title' ).attr( 'disabled', 'disabled' );
		root.find( '.jetpack-simple-payments-products' ).attr( 'disabled', 'disabled' );
		root.find( '.jetpack-simple-payments-add-product' ).attr( 'disabled', 'disabled' );
		root.find( '.jetpack-simple-payments-edit-product' ).attr( 'disabled', 'disabled' );
		root.find( '.jetpack-simple-payments-form' ).show();
	}

	function hideForm() {
		var root = getWidgetRoot.apply( this );
		root.find( '.jetpack-simple-payments-widget-title' ).removeAttr( 'disabled' );
		root.find( '.jetpack-simple-payments-products' ).removeAttr( 'disabled' );
		root.find( '.jetpack-simple-payments-add-product' ).removeAttr( 'disabled' );
		root.find( '.jetpack-simple-payments-edit-product' ).removeAttr( 'disabled' );
		root.find( '.jetpack-simple-payments-form' ).hide();
	}

	function changeFormAction( action ) {
		var root = getWidgetRoot.apply( this );
		root.find( '.jetpack-simple-payments-form-action' ).val( action ).change();
	}

	$( document ).ready( function() {
		$( document.body ).on( 'click', '.jetpack-simple-payments-add-product', function( event ) {
			event.preventDefault();

			showForm.apply( this );

			// changeFormAction.apply( this, [ 'clear' ] );
		} );

		$( document.body ).on( 'click', '.jetpack-simple-payments-edit-product', function( event ) {
			event.preventDefault();

			showForm.apply( this );

			changeFormAction.apply( this, [ 'edit' ] );
		} );

		$( document.body ).on( 'click', '.jetpack-simple-payments-cancel-form', function( event ) {
			event.preventDefault();

			hideForm.apply( this );

			changeFormAction.apply( this, [ 'clear' ] );
		} );

		$( document.body ).on( 'click', '.jetpack-simple-payments-save-product', function( event ) {
			event.preventDefault();

			// request = wp.ajax.post( 'customize-jetpack-simple-payments-button-add-new', {
			// 	'customize-jetpack-simple-payments-nonce': api.settings.nonce['customize-simple-payments'],
			// 	'customize_changeset_uuid': api.settings.changeset.uuid,
			// 	'params': { foo: 'bar' }
			// } );

			// request.done( function( response ) {
			// 	console.log( response );

			// 	var select = root.find( 'select.jetpack-simple-payments-products' ).append(
			// 		$('<option>', {
			// 			value: response.product_post_id,
			// 			text: response.product_post_title
			// 		} )
			// 	);
			// 	select.val( response.product_post_id ).change();
			// } );
		} );

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

				root.find( '.jetpack-simple-payments-image-fieldset .placeholder' ).hide();

				imageContainer.find( 'img' )
					.attr( 'src', selection.url )
					.attr( 'title', selection.title )
					.attr( 'alt', selection.caption );
				imageContainer.find( 'input[type=hidden]' ).val( selection.id ).change();

				imageContainer.show();
			} );

			mediaFrame.open();
		} );
	} );
}( wp.customize, wp, jQuery ) );
