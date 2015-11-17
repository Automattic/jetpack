<?php

class Jetpack_JSON_API_Maybe_Auto_Update_Endpoint extends Jetpack_JSON_API_Endpoint {
	// POST /sites/%s/maybe_auto_update
	protected $needed_capabilities = 'update_core';

	protected $update_results = array();

	protected function result() {
		add_action( 'automatic_updates_complete', array( $this, 'get_update_results' ), 100, 1 );

		include_once( ABSPATH . '/wp-admin/includes/admin.php' );
		include_once( ABSPATH . '/wp-admin/includes/class-wp-upgrader.php' );

		$upgrader = new WP_Automatic_Updater;

		if ( $upgrader->is_disabled() ) {
			$result['log'] = 'autoupdates-disabled';
			return $result;

		} else if ( ! is_main_site() ) {
			$result['log'] = 'is-not-main-site';
			return $result;

		} else if ( ! is_main_network() ) {
			$result['log'] = 'is-not-main-network';
			return $result;

		} else if ( $upgrader->is_vcs_checkout( ABSPATH ) ) {
			$result['log'] = 'site-on-vcs';
			return $result;

		} else if ( $upgrader->is_vcs_checkout( WP_PLUGIN_DIR ) ) {
			$result['log'] = 'plugin-directory-on-vcs';
			return $result;

		} else if ( $upgrader->is_vcs_checkout( WP_CONTENT_DIR ) ) {
			$result['log'] = 'content-directory-on-vcs';
			return $result;

		}  else {
			// we passed all the checks lets just return
			$upgrader->run();
		}

		$result['log'] = $this->update_results;
		return $result;
	}

	public function get_update_results( $results ) {
		$this->update_results = $results;
	}

}
