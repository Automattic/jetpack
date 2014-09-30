<?php

class Jetpack_JSON_API_Themes_Active_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {
	// GET  /sites/%s/themes/mine => current theme
	// POST /sites/%s/themes/mine => switch theme
	public function callback( $path = '', $blog_id = 0  ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'switch_themes', true ) ) ) {
			return $error;
		}

		if ( 'POST' === $this->api->method )
			return $this->switch_theme();
		else
			return $this->get_current_theme();
	}

	protected function switch_theme() {
		$args = $this->input();

		if ( ! isset( $args['theme'] ) || empty( $args['theme'] ) ) {
			return new WP_Error( 'missing_theme', __( 'You are required to specify a theme to switch to.', 'jetpack' ), 400 );
		}

		$theme_slug = $args['theme'];

		if ( ! $theme_slug ) {
			return new WP_Error( 'theme_not_found', __( 'Theme is empty.', 'jetpack' ), 404 );
		}

		$theme = wp_get_theme( $theme_slug );

		if ( ! $theme->exists() ) {
			return new WP_Error( 'theme_not_found', __( 'The specified theme was not found.', 'jetpack' ), 404 );
		}

		if ( ! $theme->is_allowed() ) {
			return new WP_Error( 'theme_not_found', __( 'You are not allowed to switch to this theme', 'jetpack' ), 403 );
		}

		switch_theme( $theme_slug );

		return $this->get_current_theme();
	}

	protected function get_current_theme() {
		return $this->format_theme( wp_get_theme() );
	}
}
