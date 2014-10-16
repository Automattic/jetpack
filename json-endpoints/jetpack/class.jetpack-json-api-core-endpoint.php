<?php

class Jetpack_JSON_API_Core_Endpoint extends Jetpack_JSON_API_Endpoint {

	// POST /sites/%s/core
	public function callback( $path = '', $blog_id = 0 ) {

		global $wp_version;

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_core' ) ) ) {
			return $error;
		}

		$args = $this->input();

		if ( isset( $args['autoupdate'] ) && is_bool( $args['autoupdate'] ) ) {
			$this->set_autoupdate( $args['autoupdate'] );
		}

		$autoupdate = Jetpack_Options::get_option( 'autoupdate_core', false );

		return array(
			'version' => $wp_version,
			'latest'     => $this->find_latest_core_version(),
			'autoupdate' => $autoupdate,
		);
	}

	protected function set_autoupdate( $autoupdate ) {
		Jetpack_Options::update_option( 'autoupdate_core', $autoupdate );
	}

	protected function find_latest_core_version() {
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
