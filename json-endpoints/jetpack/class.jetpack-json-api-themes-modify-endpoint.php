<?php

class Jetpack_JSON_API_Themes_Modify_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	protected $autoupdate;

	public function callback( $path = '', $blog_id = 0, $theme = null ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_themes' ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_input( $theme ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_themes() ) ) {
			return new WP_Error( 'unknown_theme', $error->get_error_messages() , 404 );
		}

		if( is_wp_error( $error = $this->validate_autoupdate() ) ) {
			return $error;
		}

		if( true === $this->autoupdate ) {
			$result = $this->flag_autoupdates();
		} else {
			$result = $this->unflag_autoupdates();
		}

		if ( 1 === count( $this->themes ) ) {
			$theme = $result[0];
			return $theme;
		}

		return array(
			'themes' => $result
		);
	}

	function validate_autoupdate() {
		$args = $this->input();
		if( ! isset( $args['autoupdate'] ) || ! is_bool( $args['autoupdate'] ) ) {
			return new WP_Error( 'invalid_parameter', __( 'Autoupdate must be true or false.', 'jetpack' ), 400 );
		}
		$this->autoupdate = $args['autoupdate'];
	}

	function flag_autoupdates() {
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

	function unflag_autoupdates() {
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