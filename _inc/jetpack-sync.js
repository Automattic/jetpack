/* global ajaxurl, sync_dashboard, wp, JSON */

jQuery( document ).ready( function($) {

	var sync_template = wp.template( 'sync-progress' );

	// initialise a syncStatus region
	// run this on an empty div
	$.fn.syncStatus = function( initial_state ) {
		function render_progress( $element, state ) {
			$element.html(
				'<h2>Queue Size: <strong>'+state.size+'</strong></h2><h2>Lag: <strong>'+state.lag+'</strong> seconds</h2>'
			);
		}

		function set_auto_refresh( $element, timeout ) {
			setTimeout( function() {
				fetch_state().done( function( new_state ) {
					render_progress( $element, new_state );
					set_auto_refresh( $element, timeout );
				} ).fail( function() {
					$element.html( 'Something went wrong' );
				} );
			}, timeout );
		}

		function fetch_state() {
			return $.getJSON(
				ajaxurl,
				{ action:'jetpack-sync-queue-status' }
			);
		}
		render_progress( this, JSON.parse( initial_state ) );
		set_auto_refresh( this, 2000 );
	};

	$.fn.resetQueueButton = function() {
		function do_reset_queue() {
			return $.getJSON(
				ajaxurl,
				{ action:'jetpack-sync-reset-queue' }
			);
		}

		this.click( do_reset_queue );
	};

	$.fn.unlockQueueButton = function() {
		function do_reset_queue() {
			return $.getJSON(
				ajaxurl,
				{ action:'jetpack-sync-unlock-queue' }
			);
		}

		this.click( do_reset_queue );
	};

	$.fn.fullSyncButton = function() {
		function begin_full_sync() {
			return $.getJSON(
				ajaxurl,
				{ action:'jetpack-sync-begin-full-sync' }
			);
		}

		function cancel_full_sync() {
			return jQuery.getJSON(
				ajaxurl,
				{ action:'jetpack-sync-cancel-full-sync' }
			);
		}

		function set_button_state( $element, new_state ) {
			if ( new_state === 'running' ) {
				$element.
					html('Full Sync Running').
					prop( 'disabled', true );
			} else if ( new_state === 'cancel' ) {
				$element.html('Cancel Sync').off( 'click' ).click( function() {
					cancel_full_sync().then( set_button_state.bind( this, $element, 'start' ) );
				} );
			} else {
				$element.html('Start Full Sync').off( 'click' ).prop( 'disabled', false ).click( function() {
					begin_full_sync().then( set_button_state.bind( this, $element, 'running' ) );
				} );
			}
		}

		set_button_state( this, 'start' );

		var $el = this;

		return {
			enable: function() {
				set_button_state( $el, 'start' );
			}
		};
	};

	$.fn.fullSyncStatus = function( $button_el ) {
		function render_full_sync_status( $element, state ) {
		
			$( '#display-sync-status' ).html( sync_template( state ) );
			// $element.html( JSON.stringify( state ) );
			$element.html('');
			// TODO: stop checking and re-enable start sync button if progress is 100%
		}

		function set_auto_refresh( $element, timeout, $button_el ) {
			setTimeout( function() {
				fetch_state().done( function( new_state ) {
					render_full_sync_status( $element, new_state );

					if ( new_state.phase === 'sending finished' ) {
						$button_el.fullSyncButton().enable();
					}
					set_auto_refresh( $element, timeout, $button_el );
				} ).fail( function() {
					$element.html( 'Something went wrong' );
				} );
			}, timeout );
		}

		function fetch_state() {
			return jQuery.getJSON(
				ajaxurl,
				{ action:'jetpack-sync-full-sync-status' }
			);
		}

		this.html( 'Loading full sync status' );
		set_auto_refresh( this, 2000, $button_el );
	};
	$( '#sync_status' ).syncStatus( sync_dashboard.queue_status );
	$( '#reset_queue_button').resetQueueButton();
	$( '#unlock_queue_button').unlockQueueButton();
	$( '#full_sync_button' ).fullSyncButton();
	$( '#full_sync_status' ).fullSyncStatus( $( '#full_sync_button' ) );
} );