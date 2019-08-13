/* jshint ignore:start */
( function( $ ) {
	window.polldaddyshortcode = {
		render: function() {
			var ratings = $( 'div.pd-rating[data-settings]' );
			var polls = $( 'div.PDS_Poll[data-settings]' );

			if ( polls ) {
				$.each( polls, function() {
					var poll = $( this ).data( 'settings' );

					if ( poll ) {
						var poll_url = document.createElement( 'a' );
						poll_url.href = poll[ 'url' ];
						if (
							poll_url.hostname != 'secure.polldaddy.com' &&
							poll_url.hostname != 'static.polldaddy.com'
						) {
							return false;
						}
						var pathname = poll_url.pathname;
						if ( ! /\/?p\/\d+\.js/.test( pathname ) ) {
							return false;
						}
						var wp_pd_js = document.createElement( 'script' );
						wp_pd_js.type = 'text/javascript';
						wp_pd_js.src = poll[ 'url' ];
						wp_pd_js.charset = 'utf-8';
						wp_pd_js.async = true;
						document.getElementsByTagName( 'head' )[ 0 ].appendChild( wp_pd_js );
					}
				} );
			}

			if ( ratings ) {
				var script = '';

				$.each( ratings, function() {
					var rating = $( this ).data( 'settings' );

					if ( rating ) {
						script +=
							'PDRTJS_settings_' +
							rating[ 'id' ] +
							rating[ 'item_id' ] +
							'=' +
							rating[ 'settings' ] +
							"; if ( typeof PDRTJS_RATING !== 'undefined' ){ if ( typeof PDRTJS_" +
							rating[ 'id' ] +
							rating[ 'item_id' ] +
							"=='undefined' ){PDRTJS_" +
							rating[ 'id' ] +
							rating[ 'item_id' ] +
							'= new PDRTJS_RATING( PDRTJS_settings_' +
							rating[ 'id' ] +
							rating[ 'item_id' ] +
							' );}}';
					}
				} );

				if ( script.length > 0 )
					$( '#polldaddyRatings' ).after(
						"<script type='text/javascript' charset='utf-8' id='polldaddyDynamicRatings'>" +
							script +
							'</script>'
					);
			}
		},
	};

	$( 'body' ).on( 'post-load pd-script-load', function() {
		window.polldaddyshortcode.render();
	} );
	$( 'body' ).trigger( 'pd-script-load' );
} )( jQuery );
/* jshint ignore:end */
