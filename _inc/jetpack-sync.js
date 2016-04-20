/* global ajaxurl */

window.JetpackSyncStatus = ( function() {
	function render_progress( selector, state ) {
		jQuery(selector).append( 'Queue Size: '+state.size+', Lag: '+state.lag+' seconds <br />' );
	}

	function set_auto_refresh( selector, timeout ) {
		setTimeout( function() {
			fetch_state().done( function( new_state ) {
				render_progress( selector, new_state );
			} );
			set_auto_refresh( selector, timeout );
		}, timeout );
	}

	function fetch_state() {
		return jQuery.getJSON(
			ajaxurl,
			{ action:'jetpack-sync-queue-status' }
		);
	}

	return {
		init: function( selector, initial_state ) {
			render_progress( selector, initial_state );
			set_auto_refresh( selector, 2000 );
			
		}
	}
} )();

// jQuery( document ).ready( function($) {
// 	var update = function( cooldown ) {
// 		var self = $( '.jetpack_sync_reindex_control' ),
// 			data;

// 		self
// 			.find( '.jetpack_sync_reindex_control_action' )
// 			.attr( 'disabled', true );

// 		self
// 			.find( '.jetpack_sync_reindex_control_status' )
// 			.html( '&hellip;' );

// 		if ( 'DONE' === self.data( 'status' ) ) {
// 			data = { action:'jetpack-sync-reindex-trigger' };
// 		} else {
// 			data = { action:'jetpack-sync-reindex-status' };
// 		}

// 		$.getJSON(
// 			ajaxurl,
// 			data,
// 			function( response ) {
// 				var self = $( '.jetpack_sync_reindex_control' ),
// 					strings,
// 					status;

// 				if ( 0 === self.length ) {
// 					return;
// 				}

// 				strings = self.data( 'strings' );
// 				status = strings[response.status].status;

// 				if ( 'INDEXING' === response.status ) {
// 					status += ' (' + Math.floor( 100 * response.posts.imported / response.posts.total ) + '%)';
// 				}

// 				self
// 					.data( 'status', response.status );

// 				self
// 					.find( '.jetpack_sync_reindex_control_action' )
// 					.val( strings[response.status].action );

// 				self
// 					.find( '.jetpack_sync_reindex_control_status' )
// 					.text( status );

// 				setTimeout( function() {
// 					$( '.jetpack_sync_reindex_control' )
// 						.find( '.jetpack_sync_reindex_control_action' )
// 						.attr( 'disabled', false );
// 				}, cooldown );
// 			}
// 		);
// 	};

// 	$( '.jetpack_sync_reindex_control' )
// 		.find( '.jetpack_sync_reindex_control_action' )
// 		.live( 'click', function( event ) {
// 			event.preventDefault();
// 			update( 5000 );
// 		} );

// 	update( 1000 );
// } );
