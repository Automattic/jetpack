<?php

class Jetpack_JSON_API_Themes_Active_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {
	// GET  /sites/%s/themes/mine => current theme
	// POST /sites/%s/themes/mine => switch theme

	// The following is copy-pasted from Jetpack_JSON_API_Themes_Endpoint,
	// with an additional line for 'author'. Unfortunately, due to the
	// current architecture (using a static variable for $_response_format
	// instead of e.g. a function), we cannot dynamically add 'author'
	// to parent::$_response_format here but need to keep this in sync with
	// Jetpack_JSON_API_Themes_Endpoint manually.
	static $_response_format = array(
		'id'           => '(string) The theme\'s ID.',
		'screenshot'   => '(string) A theme screenshot URL',
		'name'         => '(string) The name of the theme.',
		'description'  => '(string) A description of the theme.',
		'author'       => '(string) The author of the theme.',
		'tags'         => '(array) Tags indicating styles and features of the theme.',
		'log'          => '(array) An array of log strings',
		'autoupdate'   => '(bool) Whether the theme is automatically updated',
	);

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
		$theme = wp_get_theme();
		$result = $this->format_theme( $theme );
		$result['author'] = $theme->get( 'Author' );
		return $result;
	}
}
