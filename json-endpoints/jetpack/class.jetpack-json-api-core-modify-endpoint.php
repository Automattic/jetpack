<?php

class Jetpack_JSON_API_Core_Modify_Endpoint extends Jetpack_JSON_API_Core_Endpoint {
	// POST /sites/%s/core
	// POST /sites/%s/core/update
	protected $needed_capabilities = 'update_core';
	protected $action              = 'default_action';
	protected $new_version;
	protected $log;

	public function default_action() {
		$args = $this->input();

		if ( isset( $args['autoupdate'] ) && is_bool( $args['autoupdate'] ) ) {
			Jetpack_Options::update_option( 'autoupdate_core', $args['autoupdate'] );
		}

		return true;
	}

	protected function update() {
		$args = $this->input();
		$version    = isset( $args['version'] ) ? $args['version'] : false;
		$locale     = isset( $args['locale'] ) ? $args['locale'] : get_locale();

		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		delete_site_transient( 'update_core' );
		wp_version_check( array(), true );

		if ( $version ) {
			$update = find_core_update( $version, $locale );
		} else {
			$update = $this->find_latest_update_offer();
		}

		/**
		 * Pre-upgrade action
		 * 
		 * @since 3.9.3
		 * 
		 * @param object|array $update as returned by find_core_update() or find_core_auto_update()
		 */
		do_action('jetpack_pre_core_upgrade', $update);

		$skin     = new Automatic_Upgrader_Skin();
		$upgrader = new Core_Upgrader( $skin );

		$this->new_version = $upgrader->upgrade( $update );

		$this->log = $upgrader->skin->get_upgrade_messages();

		if ( is_wp_error( $this->new_version ) ) {
			return $this->new_version;
		}

		return $this->new_version;
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
