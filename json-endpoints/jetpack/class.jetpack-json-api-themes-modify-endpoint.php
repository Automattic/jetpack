<?php

class Jetpack_JSON_API_Themes_Modify_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {
	// POST  /sites/%s/themes/%s
	// POST  /sites/%s/themes

	protected $needed_capabilities = 'update_themes';
	protected $action              = 'default_action';
	protected $expected_actions    = array( 'update' );

	public function default_action() {
		$args = $this->input();
		if ( isset( $args['autoupdate'] ) && is_bool( $args['autoupdate'] ) ) {
			if ( $args['autoupdate'] ) {
				$this->autoupdate_on();
			} else {
				$this->autoupdate_off();
			}
		}

		return true;
	}

	function autoupdate_on() {
		$autoupdate_themes = Jetpack_Options::get_option( 'autoupdate_themes', array() );
		$autoupdate_themes = array_unique( array_merge( $autoupdate_themes, $this->themes ) );
		Jetpack_Options::update_option( 'autoupdate_themes', $autoupdate_themes );
	}

	function autoupdate_off() {
		$autoupdate_themes = Jetpack_Options::get_option( 'autoupdate_themes', array() );
		$autoupdate_themes = array_diff( $autoupdate_themes, $this->themes );
		Jetpack_Options::update_option( 'autoupdate_themes', $autoupdate_themes );
	}

	function update() {
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// Clear the cache.
		wp_update_themes();

		foreach ( $this->themes as $theme ) {
			// Objects created inside the for loop to clean the messages for each theme
			$skin = new Automatic_Upgrader_Skin();
			$upgrader = new Theme_Upgrader( $skin );
			$upgrader->init();
			$result   = $upgrader->upgrade( $theme );
			$this->log[ $theme ][] = $upgrader->skin->get_upgrade_messages();
		}

		if ( ! $this->bulk && ! $result ) {
			return new WP_Error( 'update_fail', __( 'There was an error updating your theme', 'jetpack' ), 400 );
		}

		return true;
	}

}