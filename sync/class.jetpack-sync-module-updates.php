<?php

class Jetpack_Sync_Module_Updates extends Jetpack_Sync_Module {
	function name() {
		return "updates";
	}

	public function init_listeners( $callable ) {
		add_action( 'set_site_transient_update_plugins', $callable, 10, 1 );
		add_action( 'set_site_transient_update_themes', $callable, 10, 1 );
		add_action( 'set_site_transient_update_core', $callable, 10, 1 );

		// full sync
		add_action( 'jetpack_full_sync_updates', $callable );

		add_filter( 'jetpack_sync_before_enqueue_set_site_transient_update_plugins', array( $this, 'filter_update_keys' ), 10, 2 );
	}

	public function full_sync() {
		/**
		 * Tells the client to sync all updates to the server
		 *
		 * @since 4.2.0
		 *
		 * @param boolean Whether to expand updates (should always be true)
		 */
		do_action( 'jetpack_full_sync_updates', true );
		return 1; // The number of actions enqueued
	}

	public function get_all_updates() {
		return array(
			'core' => get_site_transient( 'update_core' ),
			'plugins' => get_site_transient( 'update_plugins' ),
			'themes' => get_site_transient( 'update_themes' ),
		);
	}

	// removes unnecessary keys from synced updates data
	function filter_update_keys( $args ) {
		$updates = $args[0];

		if ( isset( $updates->no_update ) ) {
			unset( $updates->no_update );
		}

		return $args;
	}
}
