(function($) {
	$(document).ready( function() {
		$('.simple-payments-add-image').on( 'click', function( event ) {
			event.preventDefault();
			var frame = new wp.media.view.MediaFrame.Select({
				title: 'Choose Product Image',

				// Enable/disable multiple select
				multiple: false,

				// Library WordPress query arguments.
				library: {
					order: 'ASC',
					orderby: 'title',
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
				console.log( selection );

				// First, make sure that we have the URL of an image to display
				if ( 0 > $.trim( selection.url.length ) ) {
					return;
				}

				console.log( $( '.simple-payments-image' ).children( 'img' ) );

				// After that, set the properties of the image and display it
				$( '.simple-payments-image' )
					.children( 'img' )
				        .attr( 'src', selection.url )
				        .attr( 'alt', selection.caption )
				        .attr( 'title', selection.title );


			} );

			// Open the modal.
			frame.open();
		});
	});
})(jQuery);