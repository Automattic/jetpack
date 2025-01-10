jQuery( document ).ready( function () {
	const { __, sprintf } = window.wp.i18n;

	// Set how often to check when a preload job is running
	const ACTIVE_INTERVAL = 3000;

	// Set how often to check when no preload job is running
	const INACTIVE_INTERVAL = 30000;

	// Get a reference to the log element and the previous log entry
	const preloadInfoPanel = jQuery( '#wpsc-preload-status' );

	// Abort early if no info panel exists.
	if ( ! preloadInfoPanel.length ) {
		return;
	}

	update_preload_status( window.wpsc_preload_ajax.preload_status );

	/**
	 * Schedule the next preload status update.
	 *
	 * @param {number} time - time in milliseconds to wait before updating.
	 */
	function schedule_preload_update( time ) {
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
				}
			);
		}, time );
	}

	/**
	 * Update displayed preload status using the provided data.
	 *
	 * @param {object} data - description of the preload status.
	 */
	function update_preload_status( data ) {
		// Bail early if no data is available. But try again in a few seconds.
		if ( ! data || ( ! data.running && ! data.next && ! data.previous ) ) {
			schedule_preload_update( ACTIVE_INTERVAL );
			return;
		}

		preloadInfoPanel.empty();
		let nextPreloadTime = data.running ? ACTIVE_INTERVAL : INACTIVE_INTERVAL;

		if ( data.running ) {
			const panel = jQuery( '<div class="notice notice-warning">' );

			panel.append(
				jQuery( '<p>' ).append( jQuery( '<b>' ).text( __( 'Preloading', 'wp-super-cache' ) ) )
			);
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
				const diff = Math.max( 0, data.next - Math.floor( Date.now() / 1000 ) );
				const seconds = diff % 60;
				const minutes = Math.floor( diff / 60 ) % 60;
				const hours = Math.floor( diff / 3600 ) % 24;
				const days = Math.floor( diff / 86400 );

				// If we're preloading within the next minute, start loading faster.
				if ( minutes + hours === 0 ) {
					nextPreloadTime = ACTIVE_INTERVAL;
				}

				const p = jQuery( '<p>' );
				p.append(
					jQuery( '<b>' ).html(
						sprintf(
							/* Translators: 1: Number of days, 2: Number of hours, 3: Number of minutes, 4: Number of seconds */
							__(
								'<b>Next preload scheduled</b> in %1$s days, %2$s hours, %3$s minutes and %4$s seconds.',
								'wp-super-cache'
							),
							days,
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
				p.append( jQuery( '<b>' ).text( __( 'Last preload finished:', 'wp-super-cache' ) + ' ' ) );
				p.append( jQuery( '<span>' ).text( new Date( data.previous * 1000 ).toLocaleString() ) );
				panel.append( p );
			}

			preloadInfoPanel.append( panel );
		}

		schedule_preload_update( nextPreloadTime );
	}
} );
