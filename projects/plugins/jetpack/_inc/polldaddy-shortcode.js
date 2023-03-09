( function ( w, d ) {
	w.polldaddyshortcode = {
		render: function () {
			const ratings = d.querySelectorAll( 'div.pd-rating[data-settings]' );
			const polls = d.querySelectorAll( 'div.PDS_Poll[data-settings]' );

			polls.forEach( pollEl => {
				const isInitialized = pollEl.getAttribute( 'data-pd-init-done' );

				if ( isInitialized ) {
					return;
				}

				pollEl.setAttribute( 'data-pd-init-done', '1' );
				const settings = pollEl.getAttribute( 'data-settings' );
				const poll = settings ? JSON.parse( settings ) : null;

				if ( poll ) {
					let poll_url;
					try {
						poll_url = new URL( poll.url, 'https://invalid.tld' );
					} catch ( error ) {
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
					wp_pd_js.src = poll.url;
					wp_pd_js.async = true;
					d.head.appendChild( wp_pd_js );
				}
			} );

			if ( ratings.length ) {
				let scriptContents = '';

				ratings.forEach( ratingEl => {
					const isInitialized = ratingEl.getAttribute( 'data-pd-init-done' );

					if ( isInitialized ) {
						return;
					}

					ratingEl.setAttribute( 'data-pd-init-done', '1' );

					const settings = ratingEl.getAttribute( 'data-settings' );
					const rating = settings ? JSON.parse( settings ) : null;

					if ( rating ) {
						scriptContents += `
						PDRTJS_settings_${ rating.id }${ rating.item_id } = ${ rating.settings };
						if ( typeof PDRTJS_RATING !== 'undefined' ) {
							if ( typeof PDRTJS_${ rating.id }${ rating.item_id } === 'undefined' ) {
								PDRTJS_${ rating.id }${ rating.item_id } =
									new PDRTJS_RATING( PDRTJS_settings_${ rating.id }${ rating.item_id } );
							}
						}
						`;
					}
				} );

				if ( scriptContents ) {
					const anchorEl = d.querySelector( '#polldaddyRatings' );
					if ( anchorEl ) {
						const script = d.createElement( 'script' );
						script.id = 'polldaddyDynamicRatings';
						script.text = scriptContents;

						anchorEl.after( script );
					}
				}
			}
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
