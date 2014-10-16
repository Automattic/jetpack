<?php

class Jetpack_JSON_API_Themes_Modify_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	protected $action;

	protected $log;
	protected $autoupdate = null;

	public function callback( $path = '', $blog_id = 0, $theme = null ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_themes' ) ) ) {
			return $error;
		}

		if( is_wp_error( $error = $this->validate_action() ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_input( $theme ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_themes() ) ) {
			return new WP_Error( 'unknown_theme', $error->get_error_messages() , 404 );
		}

		if ( ! empty( $this->action ) ) {
			if ( is_wp_error( $result = call_user_func( array( $this, $this->action ) ) ) ) {
				return $result;
			}
		}

		if( ! is_null( $this->autoupdate ) ) {
			$autoupdate_action = ( $this->autoupdate ) ? 'autoupdate_on' : 'autoupdate_off';
			call_user_func( array( $this, $autoupdate_action ) );
		}

		$themes = $this->format_themes( $this->themes );

		if ( ! $this->bulk && ! empty( $themes ) ) {
			return array_pop( $themes );
		}

		return array( 'themes' => $themes );

	}

	protected function validate_action() {
		$expected_actions = array(
			'update',
		);
		$args = $this->input();
		if( ! empty( $args['action'] ) ) {
			if( ! in_array( $args['action'], $expected_actions ) )
				return new WP_Error( 'invalid_action', __( 'You must specify a valid action', 'jetpack' ));
			$this->action =  $args['action'];
		}
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