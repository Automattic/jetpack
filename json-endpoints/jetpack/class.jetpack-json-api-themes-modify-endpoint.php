<?php

class Jetpack_JSON_API_Themes_Modify_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	protected $action;

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

		if ( 1 === count( $this->themes ) ) {
			$theme = $result[0];
			return $theme;
		}

		$response['themes'] = $result;

		return $response;
	}

	protected function validate_action() {
		$expected_actions = array(
			'update',
			'autoupdate_on',
			'autoupdate_off',
		);
		$args = $this->input();
		if( empty( $args['action'] ) || ! in_array( $args['action'], $expected_actions ) ) {
			return new WP_Error( 'invalid_action', __( 'You must specify a valid action', 'jetpack' ));
		}
		$this->action =  $args['action'];
	}

	function autoupdate_on() {
		$autoupdate_themes = Jetpack_Options::get_option( 'autoupdate_themes', array() );
		foreach( $this->themes as $index => $theme ) {
			$result[ $index ] = $this->format_theme( wp_get_theme( $theme ) );
			if( ! in_array( $theme, $autoupdate_themes ) ) {
				$autoupdate_themes[] = $theme;
				$result[ $index ]['log'][] = 'This theme has been set to automatically update.';
			} else {
				$result[ $index ]['log'][] = 'This theme is already set to automatically update.';
			}
		}
		Jetpack_Options::update_option( 'autoupdate_themes', $autoupdate_themes );
		return $result;
	}

	function autoupdate_off() {
		$autoupdate_themes = Jetpack_Options::get_option( 'autoupdate_themes', array() );

		foreach( $this->themes as $index => $theme ) {
			$result[ $index ] = $this->format_theme( wp_get_theme( $theme ) );
			$found = array_search( $theme, $autoupdate_themes );
			if( $found !== false ) {
				unset( $autoupdate_themes[ $found ] );
				$result[ $index ]['log'][] = 'This theme has been set to manually update.';
			} else {
				$result[ $index ]['log'][] = 'This theme is already set to manually update.';
			}
		}
		$reindexed = array_values( $autoupdate_themes );
		Jetpack_Options::update_option( 'autoupdate_themes', $reindexed );
		return $result;
	}

}