<?php

class Jetpack_JSON_API_Core_Update_Endpoint extends Jetpack_JSON_API_Endpoint {

	// POST /sites/%s/core/update
	public function callback( $path = '', $blog_id = 0 ) {


		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_core', false ) ) ) {
			return $error;
		}

		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		$args = $this->input();
		$version    = isset( $args['version'] ) ? $args['version'] : false;
		$locale     = isset( $args['locale'] ) ? $args['locale'] : get_locale();

		if ( is_wp_error( $error = $this->update_core( $version, $locale ) ) ) {
			return $error;
		}

		global $wp_version;
		return array(
			'version' => $wp_version,
			'log'     => $this->log,
		);
	}

	private function update_core( $version, $locale ) {
		$update   = find_core_update( $version, $locale );

		$skin     = new Automatic_Upgrader_Skin();
		$upgrader = new Core_Upgrader( $skin );

		$result   = $upgrader->upgrade( $update );

		$this->log = $upgrader->skin->get_upgrade_messages();

		return $result;
	}
}
