( function( $ ) {

	/**
	 * A function to help debouncing.
	 */
	var debounce = function( func, wait ) {

		var timeout, args, context, timestamp;

		return function() {

			context = this;
			args = [].slice.call( arguments, 0 );
			timestamp = new Date();

			var later = function() {

				var last = ( new Date() ) - timestamp;

				if ( last < wait ) {
					timeout = setTimeout( later, wait - last );
				} else {
					timeout = null;
					func.apply( context, args );
				}

			};

			if ( ! timeout ) {
				timeout = setTimeout( later, wait );
			}

		};

	};

	/**
	 * A function to resize videos.
	 */
	function responsive_videos() {
		
		$( '.jetpack-video-wrapper' ).find( 'embed, iframe, object' ).each( function() {
			var video_element, video_width, video_height, video_ratio, video_wrapper, container_width;
			
			video_element = $( this );

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

			video_width     = video_element.attr( 'data-width' );
			video_height    = video_element.attr( 'data-height' );
			video_ratio     = video_element.attr( 'data-ratio' );
			video_wrapper   = video_element.parent();
			container_width = video_wrapper.width();

			if ( video_ratio === 'Infinity' ) {
				video_width = '100%';
			}

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

	/**
	 * Load responsive_videos().
	 * Trigger resize to make sure responsive_videos() is loaded after IS.
	 */
	$( window ).load( responsive_videos ).resize( debounce( responsive_videos, 100 ) ).trigger( 'resize' );
	$( document ).on( 'post-load', responsive_videos );

} )( jQuery );