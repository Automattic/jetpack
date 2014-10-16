<?php

class Jetpack_JSON_API_Themes_Modify_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	protected $action;
	protected $update_log;
	protected $updated;
	protected $not_updated;
	protected $log;
	protected $autoupdate = null;

	public function callback( $path = '', $blog_id = 0, $theme = null ) {

		if( is_wp_error( $error = $this->validate_action() ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_themes' ) ) ) {
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

		if ( 1 === count( $this->themes ) ) {
			return self::get_theme();
		}
		return self::get_themes();
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
		foreach( $this->themes as $index => $theme ) {
			if( ! in_array( $theme, $autoupdate_themes ) ) {
				$autoupdate_themes[] = $theme;
				$this->log[ $theme ][] = 'This theme has been set to automatically update.';
			} else {
				$this->log[ $theme ][] = 'This theme is already set to automatically update.';
			}
		}
		Jetpack_Options::update_option( 'autoupdate_themes', $autoupdate_themes );
	}

	function autoupdate_off() {
		$autoupdate_themes = Jetpack_Options::get_option( 'autoupdate_themes', array() );

		foreach( $this->themes as $index => $theme ) {
			$found = array_search( $theme, $autoupdate_themes );
			if( $found !== false ) {
				unset( $autoupdate_themes[ $found ] );
				$this->log[ $theme ][] = 'This theme has been set to manually update.';
			} else {
				$this->log[ $theme ][] = 'This theme is already set to manually update.';
			}
		}
		$reindexed = array_values( $autoupdate_themes );
		Jetpack_Options::update_option( 'autoupdate_themes', $reindexed );
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

		if ( 0 === count( $this->updated ) && 1 === count( $this->themes ) ) {
			return new WP_Error( 'update_fail', $this->update_log, 400 );
		}
	}

}