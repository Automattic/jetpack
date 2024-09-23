/* global wp */
( function ( win, $, wp ) {
	$( '#widgets-right' ).on( 'click', '.music-player-edit', function ( event ) {
		let shortcode, frame, attrs;
		event.preventDefault();
		const id = $( this ).data( 'widget_id' );
		const $shortcode = $( '#' + id );
		shortcode = $shortcode.val();

		if ( ! shortcode ) {
			frame = wp
				.media( {
					frame: 'post',
					state: 'playlist-edit',
					editing: false,
					multiple: true,
				} )
				.open();
		} else {
			shortcode = wp.shortcode.next( 'playlist', shortcode );

			if ( ! shortcode ) {
				if ( window.console ) {
					window.console.error( 'Playlist shortcode malformed.' );
				}
				$shortcode.val( '' );

				frame = wp
					.media( {
						frame: 'post',
						state: 'playlist-edit',
						editing: false,
						multiple: true,
					} )
					.open();
			} else {
				shortcode = shortcode.shortcode;

				// Update old .com attributes to the post-3.9 form
				if ( shortcode.attrs ) {
					attrs = shortcode.attrs;
					if ( attrs.named.tracks && ! attrs.named.ids ) {
						attrs.named.ids = attrs.named.tracks;
						delete attrs.named.tracks;
					}

					if ( attrs.named.random && ! attrs.named.orderby ) {
						attrs.named.orderby = 'rand';
						delete attrs.named.random;
					}
				}

				shortcode = shortcode.string();

				frame = wp.media.playlist.edit( shortcode );
			}
		}

		frame.state( 'playlist-edit' ).on( 'update', function ( selection ) {
			const shortcodeString = wp.media.playlist.shortcode( selection ).string();
			$shortcode.val( shortcodeString ).change();
			frame.detach();
		} );
	} );
} )( window, jQuery, wp );
