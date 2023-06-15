jQuery( document ).ready( function () {
	const { __, sprintf } = window.wp.i18n;

	// Set how often to check.
	const CHECK_INTERVAL = 3000;

	// Get a reference to the log element and the previous log entry
	const preloadInfoPanel = jQuery( '#wpsc-preload-status' );

	// Abort early if no info panel exists.
	if ( ! preloadInfoPanel.length ) {
		return;
	}

	update_preload_status( window.wpsc_preload_ajax.preload_status );
	run_preload_interval();

	/**
	 * Regularly check the preload status.
	 */
	function run_preload_interval() {
		setTimeout( () => {
			jQuery.post(
				window.wpsc_preload_ajax.ajax_url,
				{
					action: 'wpsc_get_preload_status',
				},
				json => {
					if ( ! json || ! json.success ) {
						return;
					}

					update_preload_status( json.data );
					run_preload_interval();
				}
			);
		}, CHECK_INTERVAL );
	}

	/**
	 * Update displayed preload status using the provided data.
	 *
	 * @param {object} data - description of the preload status.
	 */
	function update_preload_status( data ) {
		// Bail early if no data is available.
		if ( ! data || ( ! data.running && ! data.next && ! data.previous ) ) {
			return;
		}

		preloadInfoPanel.empty();

		if ( data.running ) {
			const panel = jQuery( '<div class="notice notice-warning">' );

			panel.append( jQuery( '<b>' ).text( __( 'Preloading', 'wp-super-cache' ) ) );
			panel.append(
				jQuery( '<p>' ).text( __( 'Preloading is currently running.', 'wp-super-cache' ) )
			);

			const ul = panel.append( jQuery( '<ul>' ) );
			for ( const entry of data.history ) {
				ul.append( jQuery( '<li>' ).text( entry.group + ' ' + entry.progress + ': ' + entry.url ) );
			}

			preloadInfoPanel.append( panel );
		} else if ( data.next || data.previous ) {
			const panel = jQuery( '<div class="notice notice-info">' );

			if ( data.next ) {
				const diff = data.next - Math.floor( Date.now() / 1000 );
				const seconds = diff % 60;
				const minutes = Math.floor( diff / 60 ) % 60;
				const hours = Math.floor( diff / 3600 ) % 24;

				const p = jQuery( '<p>' );
				p.append(
					jQuery( '<b>' ).html(
						sprintf(
							/* Translators: 1: Number of hours, 2: Number of minutes, 3: Number of seconds */
							__(
								'<b>Next preload scheduled</b> in %1$s hours, %2$s minutes and %3$s seconds.',
								'wp-super-cache'
							),
							hours,
							minutes,
							seconds
						)
					)
				);

				panel.append( p );
			}

			if ( data.previous ) {
				const p = jQuery( '<p>' );
				p.append( jQuery( '<b>' ).text( __( 'Last preload finished:', 'wp-super-cache' ) ) );
				p.append( jQuery( '<span>' ).text( new Date( data.previous * 1000 ).toLocaleString() ) );
				panel.append( p );
			}

			preloadInfoPanel.append( panel );
		}
	}
} );
