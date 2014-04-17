( function( $ ) {

	function responsive_videos() {

		$( '.jetpack-video-wrapper' ).find( 'embed, iframe, object' ).each( function() {

			var video_element   = $( this );

			if ( ! video_element.attr( 'data-ratio' ) ) {

				video_element
					.attr( 'data-ratio', this.height / this.width )
					.attr( 'data-width', this.width )
					.attr( 'data-height', this.height )
					.css( {
						'display' : 'block',
						'margin'  : 0
					} );

			}

			var video_width     = video_element.attr( 'data-width' ),
			    video_height    = video_element.attr( 'data-height' ),
			    video_ratio     = video_element.attr( 'data-ratio' ),
			    video_wrapper   = video_element.parent(),
			    container_width = video_wrapper.width();

			video_element
				.removeAttr( 'height' )
				.removeAttr( 'width' );

			if ( video_width > container_width ) {

				video_element
					.width( container_width )
					.height( container_width * video_ratio );

			} else {

				video_element
					.width( video_width )
					.height( video_height );

			}

		} );

	}

	/*
	 * Load responsive_videos().
	 * Trigger resize to make sure responsive_videos() is loaded after IS.
	 */
	$( window ).load( responsive_videos ).resize( _.debounce( responsive_videos, 100 ) ).trigger( 'resize' );
	$( document ).on( 'post-load', responsive_videos );

} )( jQuery );