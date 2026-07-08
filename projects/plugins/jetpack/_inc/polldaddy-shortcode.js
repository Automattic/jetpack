( function ( w, d ) {
	function parseJSON( str ) {
		try {
			return str ? w.JSON.parse( str ) : null;
		} catch {
			return null;
		}
	}

	w.polldaddyshortcode = {
		render: function () {
			const ratings = d.querySelectorAll( 'div.pd-rating[data-settings]' );
			const polls = d.querySelectorAll( 'div.PDS_Poll[data-settings]' );

			polls.forEach( pollEl => {
				if ( pollEl.hasAttribute( 'data-pd-init-done' ) ) {
					return;
				}

				pollEl.setAttribute( 'data-pd-init-done', '1' );
				const poll = parseJSON( pollEl.getAttribute( 'data-settings' ) );

				if ( poll ) {
					let poll_url;
					try {
						poll_url = new w.URL( poll.url, 'https://invalid.tld' );
					} catch {
						return false;
					}
					if (
						poll_url.hostname !== 'secure.polldaddy.com' &&
						poll_url.hostname !== 'static.polldaddy.com'
					) {
						return false;
					}
					const pathname = poll_url.pathname;
					if ( ! /\/?p\/\d+\.js/.test( pathname ) ) {
						return false;
					}
					const wp_pd_js = d.createElement( 'script' );
					wp_pd_js.src = poll_url.href;
					wp_pd_js.async = true;
					d.head.appendChild( wp_pd_js );
				}
			} );

			ratings.forEach( ratingEl => {
				if ( ratingEl.hasAttribute( 'data-pd-init-done' ) ) {
					return;
				}

				ratingEl.setAttribute( 'data-pd-init-done', '1' );

				const rating = parseJSON( ratingEl.getAttribute( 'data-settings' ) );

				if ( ! rating ) {
					return;
				}

				const settings = parseJSON( rating.settings );

				if ( settings === null ) {
					return;
				}

				const key = `${ rating.id }${ rating.item_id }`;
				w[ `PDRTJS_settings_${ key }` ] = settings;

				if (
					typeof w.PDRTJS_RATING !== 'undefined' &&
					typeof w[ `PDRTJS_${ key }` ] === 'undefined'
				) {
					w[ `PDRTJS_${ key }` ] = new w.PDRTJS_RATING( w[ `PDRTJS_settings_${ key }` ] );
				}
			} );
		},
	};

	d.body.addEventListener( 'is.post-load', () => w.polldaddyshortcode.render() );

	// In environments where jQuery is present, listen and dispatch with jQuery.
	if ( typeof w.jQuery !== 'undefined' ) {
		w.jQuery( d.body ).on( 'pd-script-load', () => w.polldaddyshortcode.render() );
		w.jQuery( d.body ).trigger( 'pd-script-load' );
	} else {
		d.body.addEventListener( 'pd-script-load', () => w.polldaddyshortcode.render() );
		d.body.dispatchEvent( new Event( 'pd-script-load' ) );
	}
} )( window, document );
