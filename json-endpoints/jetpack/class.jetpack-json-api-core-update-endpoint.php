<?php

class Jetpack_JSON_API_Core_Update_Endpoint extends Jetpack_JSON_API_Core_Endpoint {

	protected $log;

	// POST /sites/%s/core/update
	public function callback( $path = '', $blog_id = 0 ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_core' ) ) ) {
			return $error;
		}

		$args = $this->input();
		$version    = isset( $args['version'] ) ? $args['version'] : false;
		$locale     = isset( $args['locale'] ) ? $args['locale'] : get_locale();

		$new_version = $this->update_core( $version, $locale );

		if ( is_wp_error( $new_version ) ) {
			return $new_version;
		}

		return array(
			'version' => $new_version,
			'log'     => $this->log,
		);
	}

	private function update_core( $version, $locale ) {

		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		delete_site_transient( 'update_core' );
		wp_version_check( array(), true );

		if ( $version ) {
			$update = find_core_update( $version, $locale );
		} else {
			$update = $this->find_latest_update_offer();
		}

		$skin     = new Automatic_Upgrader_Skin();
		$upgrader = new Core_Upgrader( $skin );

		$result   = $upgrader->upgrade( $update );

		$this->log = $upgrader->skin->get_upgrade_messages();

		return $result;
	}

	protected function find_latest_update_offer() {
		// Select the latest update.
		// Remove filters to bypass automattic updates.
		add_filter( 'request_filesystem_credentials',      '__return_true'  );
		add_filter( 'automatic_updates_is_vcs_checkout',   '__return_false' );
		add_filter( 'allow_major_auto_core_updates',       '__return_true'  );
		add_filter( 'send_core_update_notification_email', '__return_false' );
		$update = find_core_auto_update();
		remove_filter( 'request_filesystem_credentials',      '__return_true'  );
		remove_filter( 'automatic_updates_is_vcs_checkout',   '__return_false' );
		remove_filter( 'allow_major_auto_core_updates',       '__return_true'  );
		remove_filter( 'send_core_update_notification_email', '__return_false' );
		return $update;
	}

}
