/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync Hub page JS
 */

jQuery( function ( $ ) {
	// initiate
	if ( window.jpcrm_woo_connect_initiate_ajax_sync ) {
		jpcrm_woosync_initiate_sync();

		// remove URL param to prevent refresh from restarting anew
		var url = new URL( location );
		url.searchParams.delete( 'definitely_restart_sync' );
		history.replaceState( null, null, url );
	}

	// bind clickable stats
	jQuery( '.jpcrm-clickable' ).on( 'click', function () {
		var url = jQuery( this ).attr( 'data-href' );
		if ( url ) {
			window.open( url, '_blank' ).trigger( 'focus' );
		}
	} );
} );

/*
 * Initiate WooSync sync
 */
/**
 *
 */
function jpcrm_woosync_initiate_sync() {
	// console.log( 'Initiating WooSync Background sync...' );

	// hide any other progress icons/messages
	// where present, add 'active' class to #jpcrm_firing_ajax
	jQuery( '#jpcrm_failed_ajax' ).hide();
	jQuery( '#jpcrm_firing_ajax' ).addClass( 'active' );

	// initiate
	jpcrm_woosync_fire_sync(
		function ( response ) {
			// successfully ran 1 sync job
			jQuery( '#jpcrm_failed_ajax' ).hide();

			/* This will return an object as follows:

			{
				'status'               => 'completed_sync',
				'status_short_text'    => 'Sync Completed',
				'status_long_text'     => 'Yay, the sync completed successfully!',
				'page_no'              => $page_no,
				'orders_imported'      => 10,
				'percentage_completed' => 100,
			}

			// As at 30/03/22 'status' can be:
			'job_in_progress', 'sync_completed', or 'sync_part_complete'
		*/

			var sleep_time = 1000,
				completed = false,
				remaining_pages = -1,
				percentage_completed = -1;

			// fill them out if present
			if ( typeof response.status !== 'undefined' ) {
				if ( response.last_order_synced ) {
					document.getElementById( 'jpcrm-woosync-stat-last-order-synced' ).innerHTML =
						response.last_order_synced;
				}
				if ( response.contacts_synced ) {
					document.getElementById( 'jpcrm-woosync-stat-contacts-synced' ).innerHTML =
						response.contacts_synced;
				}
				if ( response.transactions_synced ) {
					document.getElementById( 'jpcrm-woosync-stat-transactions-synced' ).innerHTML =
						response.transactions_synced;
				}
				if ( response.transaction_total ) {
					document.getElementById( 'jpcrm-woosync-stat-transaction-total' ).innerHTML =
						response.transaction_total;
				}

				switch ( response.status ) {
					// ajax hit an existing job-in-progress
					case 'job_in_progress':
						// here we keep a tally of how many times we've tried to sync and hit this buffer
						// ... if we hit it 10 times with breaks between, we stop trying
						if ( typeof window.jpcrm_woosync_sync_blocked_runs === 'undefined' ) {
							window.jpcrm_woosync_sync_blocked_runs = 0;
						}

						// increment
						window.jpcrm_woosync_sync_blocked_runs++;

						// and set a 10s wait
						sleep_time = 10000;

						break;
					case 'sync_part_complete':
						document.getElementById( 'jpcrm-woosync-status-short-text' ).textContent =
							response.status_short_text +
							' (' +
							Math.round( response.percentage_completed ) +
							'%)';

						break;
					case 'sync_completed':
						// pause here and display notice
						jQuery( '#jpcrm_firing_ajax' ).removeClass( 'active' );
						document.getElementById( 'jpcrm-woosync-status-icon' ).className =
							'icon thumbs up green';
						document.getElementById( 'jpcrm-woosync-status-short-text' ).textContent =
							response.status_short_text;
						document.getElementById( 'jpcrm-woosync-status-long-text' ).textContent =
							response.status_long_text;
						return;

					case 'not_in_ready_mode':
						// pause here and display notice
						jQuery( '#jpcrm_firing_ajax' ).removeClass( 'active' );
						jQuery( '#jpcrm_failed_ajax' ).show();
						document.getElementById( 'jpcrm-woosync-status-icon' ).className =
							'icon settings orange';
						document.getElementById( 'jpcrm-woosync-status-short-text' ).textContent =
							response.status_short_text;
						document.getElementById( 'jpcrm-woosync-status-short-text' ).className =
							'status orange';
						document.getElementById( 'jpcrm-woosync-status-long-text' ).textContent =
							response.status_long_text;
						return;

					case 'error':
						// pause here and display notice
						jQuery( '#jpcrm_firing_ajax' ).removeClass( 'active' );
						jQuery( '#jpcrm_failed_ajax' ).show();
						document.getElementById( 'jpcrm-woosync-status-icon' ).className =
							'icon settings orange';
						document.getElementById( 'jpcrm-woosync-status-short-text' ).textContent =
							response.status_short_text;
						document.getElementById( 'jpcrm-woosync-status-short-text' ).className =
							'status orange';
						document.getElementById( 'jpcrm-woosync-status-long-text' ).textContent =
							response.status_long_text;
						return;
				}

				if ( typeof response.remaining_pages !== 'undefined' ) {
					remaining_pages = parseInt( response.remaining_pages );
				}
				if ( typeof response.percentage_completed !== 'undefined' ) {
					percentage_completed = response.percentage_completed;
				}

				// console.log( 'WooSync Background sync has more pages...' );

				// append title where material to build one
				var title = '';
				if ( remaining_pages > 0 ) {
					title = jpcrm_woosync_language_label( 'pages_remain', '{0} pages remain' ).format(
						remaining_pages
					);
				}
				if ( percentage_completed > 0 ) {
					title += ' (' + Math.round( percentage_completed ) + '%)';
				}

				if ( title !== '' ) {
					jQuery( '#jpcrm_firing_ajax' ).attr( 'title', title );
				}

				// restart, (so long as we've not hit a blocker 10 times)
				if (
					typeof window.jpcrm_woosync_sync_blocked_runs === 'undefined' ||
					window.jpcrm_woosync_sync_blocked_runs < 10
				) {
					jpcrm_sleep( sleep_time ).then( () => {
						jpcrm_woosync_initiate_sync();
					} );
				} else {
					// effectively an error (10 times the AJAX has bounced back saying 'already running')
					error_type = 'caught_mid_job';
					error_string = jpcrm_woosync_language_label(
						error_type,
						'Import job is running in the back end. If this message is still shown after some time, please contact support.'
					);

					// pause here and display notice
					jQuery( '#jpcrm_firing_ajax' ).removeClass( 'active' );
					document.getElementById( 'jpcrm-woosync-status-short-text' ).textContent = error_type;
					document.getElementById( 'jpcrm-woosync-status-long-text' ).textContent = error_string;
				}
			}
		},
		function ( response ) {
			// failed to run sync job for some reason...
			var error_string = '';

			if ( response.statusText == 'timeout' ) {
				// AJAX call timed out, but cron should catch it
				error_type = 'caught_mid_job';
				error_string = jpcrm_woosync_language_label(
					error_type,
					'Import job is running in the back end. If this message is still shown after some time, please contact support.'
				);
			} else if ( response.status == 0 && response.statusText == 'error' ) {
				// probably blocked or cancelled (via a page refresh)...ignore
				return;
			} else {
				// server crash
				error_type = 'server_error';
				error_string =
					jpcrm_woosync_language_label( error_type, 'There was a general server error.' ) +
					' (' +
					response.status +
					')';
				document.getElementById( 'jpcrm-woosync-status-icon' ).className = 'icon thumbs down red';
				document.getElementById( 'jpcrm-woosync-status-short-text' ).className = 'status red';
			}

			// pause here and display notice
			jQuery( '#jpcrm_firing_ajax' ).removeClass( 'active' );
			document.getElementById( 'jpcrm-woosync-status-short-text' ).textContent = error_type;
			document.getElementById( 'jpcrm-woosync-status-long-text' ).textContent = error_string;
			return;
		}
	);
}

/*
 * AJAX WooSync sync call
 */
/**
 * @param success_callback
 * @param error_callback
 */
function jpcrm_woosync_fire_sync( success_callback, error_callback ) {
	if ( ! window.jpcrm_woosync_firing_sync ) {
		// set blocker
		window.jpcrm_woosync_firing_sync = true;

		// postbag!
		var data = {
			action: 'jpcrm_woosync_fire_sync_job',
			sec: window.jpcrm_woosync_nonce,
		};

		// Send
		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl,
			data: data,
			dataType: 'json',
			timeout: 20000,
			success: function ( response ) {
				// unset blocker
				window.jpcrm_woosync_firing_sync = false;

				// any success callback?
				if ( typeof success_callback === 'function' ) {
					success_callback( response );
				}
			},
			error: function ( response ) {
				// unset blocker
				window.jpcrm_woosync_firing_sync = false;

				// any error callback?
				if ( typeof error_callback === 'function' ) {
					error_callback( response );
				}
			},
		} );
	} // / not blocked
}

/*
 * returns a language label as passed from php in output_language_labels()
 */
/**
 * @param key
 * @param fallback
 */
function jpcrm_woosync_language_label( key, fallback ) {
	if (
		typeof window.jpcrm_woosync_language_labels !== 'undefined' &&
		typeof window.jpcrm_woosync_language_labels[ key ] !== 'undefined'
	) {
		return window.jpcrm_woosync_language_labels[ key ];
	}

	if ( typeof fallback === 'undefined' ) {
		return '';
	}

	return fallback;
}

/*
* effectively sprintf for JS
NOTE: shall we move this to Core (if we agree)... it'll mean we can use arguments in passed lang labels
*/
if ( ! String.prototype.format ) {
	String.prototype.format = function () {
		var args = arguments;
		return this.replace( /{(\d+)}/g, function ( match, number ) {
			return typeof args[ number ] !== 'undefined' ? args[ number ] : match;
		} );
	};
}

if ( typeof module !== 'undefined' ) {
    module.exports = { jpcrm_woosync_initiate_sync, jpcrm_woosync_fire_sync,
		jpcrm_woosync_language_label };
}
