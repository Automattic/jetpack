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
		$upgrader->run();

		$skin = new Automatic_Upgrader_Skin;

		$result['log'] = $this->update_results;
		if ( empty( $result['log'] ) ) {
			// Lets check some reasons why it might not be working as expected
			if ( $upgrader->is_disabled() ) {
				$result['log'][] = 'autoupdates-disabled';
			}

			if ( ! is_main_site() ) {
				$result['log'][] = 'is-not-main-site';
			}

			if ( ! is_main_network() ) {
				$result['log'][] = 'is-not-main-network';
			}

			if ( $upgrader->is_vcs_checkout( ABSPATH ) ) {
				$result['log'][] = 'site-on-vcs';
			}

			if ( $upgrader->is_vcs_checkout( WP_PLUGIN_DIR ) ) {
				$result['log'][] = 'plugin-directory-on-vcs';
			}

			if ( $upgrader->is_vcs_checkout( WP_CONTENT_DIR ) ) {
				$result['log'][] = 'content-directory-on-vcs';
			}

			include_once( ABSPATH . 'wp-admin/includes/file.php' );
			include_once( ABSPATH . 'wp-admin/includes/template.php' );
			if ( ! $skin->request_filesystem_credentials( false, ABSPATH, false ) ) {
				$result['log'][] = 'no-system-write-access';
			}

			if ( ! $skin->request_filesystem_credentials( false, WP_PLUGIN_DIR, false )  ) {
				$result['log'][] = 'no-plugin-directory-write-access';
			}

			if ( ! $skin->request_filesystem_credentials( false,  WP_CONTENT_DIR, false ) ) {
				$result['log'][] = 'no-wp-content-directory-write-access';
			}
			$lock = get_option( 'auto_updater.lock' );
			if ( $lock > ( time() - HOUR_IN_SECONDS ) ) {
				$result['log'][] = 'lock-is-set';
			}
		}

		return $result;
	}

	public function get_update_results( $results ) {
		$this->update_results = $results;
	}

}
