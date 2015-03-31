<?php


// THEMES

/**
 * Base class for working with themes, has useful helper functions.
 */
abstract class Jetpack_JSON_API_Themes_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $themes = array();

	protected $bulk = true;
	protected $log;

	static $_response_format = array(
		'id'           => '(string) The theme\'s ID.',
		'screenshot'   => '(string) A theme screenshot URL',
		'name'         => '(string) The name of the theme.',
		'description'  => '(string) A description of the theme.',
		'tags'         => '(array) Tags indicating styles and features of the theme.',
		'log'          => '(array) An array of log strings',
		'autoupdate'   => '(bool) Whether the theme is automatically updated',
	);

	protected function result() {

		$themes = $this->get_themes();

		if ( ! $this->bulk && ! empty( $themes ) ) {
			return array_pop( $themes );
		}

		return array( 'themes' => $themes );

	}

	/**
	 * Walks through either the submitted theme or list of themes and creates the global array
	 * @param $theme
	 *
	 * @return bool
	 */
	protected function validate_input( $theme ) {
		$args = $this->input();
		// lets set what themes were requested, and validate them
		if ( ! isset( $theme ) || empty( $theme ) ) {

			if ( ! $args['themes'] || empty( $args['themes'] ) ) {
				return new WP_Error( 'missing_theme', __( 'You are required to specify a theme to update.', 'jetpack' ), 400 );
			}
			if ( is_array( $args['themes'] ) ) {
				$this->themes = $args['themes'];
			} else {
				$this->themes[] = $args['themes'];
			}
		} else {
			$this->themes[] = urldecode( $theme );
			$this->bulk = false;
		}

		if ( is_wp_error( $error = $this->validate_themes() ) ) {
			return error;
		}

		return parent::validate_input( $theme );
	}

	/**
	 * Walks through submitted themes to make sure they are valid
	 * @return bool|WP_Error
	 */
	protected function validate_themes() {
		foreach ( $this->themes as $theme ) {
			if ( is_wp_error( $error = wp_get_theme( $theme )->errors() ) ) {
				return new WP_Error( 'unknown_theme', $error->get_error_messages() , 404 );
			}
		}
		return true;
	}

	/**
	 * Format a theme for the public API
	 * @param  object $theme WP_Theme object
	 * @return array Named array of theme info used by the API
	 */
	protected function format_theme( $theme ) {

		if ( ! ( $theme instanceof WP_Theme ) ) {
			$theme = wp_get_theme( $theme );
		}

		$fields = array(
			'name'        => 'Name',
			'description' => 'Description',
			'tags'        => 'Tags',
			'version'     => 'Version'
		);

		$id = $theme->get_stylesheet();
		$formatted_theme = array(
			'id'          => $id,
			'screenshot'  => jetpack_photon_url( $theme->get_screenshot(), array(), 'network_path' )
		);

		foreach( $fields as $key => $field ) {
			$formatted_theme[ $key ] = $theme->get( $field );
		}

		$update_themes = get_site_transient( 'update_themes' );
		$formatted_theme['update'] = ( isset( $update_themes->response[ $id ] ) ) ? $update_themes->response[ $id ] : null;

		$autoupdate_themes = Jetpack_Options::get_option( 'autoupdate_themes', array() );

		$autoupdate = in_array( $id, $autoupdate_themes );

		$formatted_theme['autoupdate'] = $autoupdate;

		if( isset( $this->log[ $id ] ) ) {
			$formatted_theme['log'] = $this->log[ $id ];
		}

		return $formatted_theme;
	}

	/**
	 * Checks the query_args our collection endpoint was passed to ensure that it's in the proper bounds.
	 * @return bool|WP_Error a WP_Error object if the args are out of bounds, true if things are good.
	 */
	protected function check_query_args() {
		$args = $this->query_args();
		if ( $args['offset'] < 0 )
			return new WP_Error( 'invalid_offset', __( 'Offset must be greater than or equal to 0.', 'jetpack' ), 400 );
		if ( $args['limit'] < 0 )
			return new WP_Error( 'invalid_limit', __( 'Limit must be greater than or equal to 0.', 'jetpack' ), 400 );
		return true;
	}

	/**
	 * Format a list of themes for public display, using the supplied offset and limit args
	 * @uses   WPCOM_JSON_API_Endpoint::query_args()
	 * @return array         Public API theme objects
	 */
	protected function get_themes() {
		// ditch keys
		$themes = array_values( $this->themes );
		// do offset & limit - we've already returned a 400 error if they're bad numbers
		$args = $this->query_args();

		if ( isset( $args['offset'] ) )
			$themes = array_slice( $themes, (int) $args['offset'] );
		if ( isset( $args['limit'] ) )
			$themes = array_slice( $themes, 0, (int) $args['limit'] );

		return array_map( array( $this, 'format_theme' ), $themes );
	}

}
