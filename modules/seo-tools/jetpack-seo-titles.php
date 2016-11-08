<?php

/*
 * Each title format is an array of arrays containing two values:
 *  - type
 *  - value
 *
 * Possible values for type are: 'token' and 'string'.
 * Possible values for 'value' are: any string in case that 'type' is set
 * to 'string', or allowed token values for page type in case that 'type'
 * is set to 'token'.
 *
 * Examples of valid formats:
 *
 * [
 *  'front_page' => [
 *      [ 'type' => 'string', 'value' => 'Front page title and site name:'],
 *      [ 'type' => 'token', 'value' => 'site_name']
 *  ],
 *  'posts' => [
 *      [ 'type' => 'token', 'value' => 'site_name' ],
 *      [ 'type' => 'string', 'value' => ' | ' ],
 *      [ 'type' => 'token', 'value' => 'post_title' ]
 *  ],
 *  'pages' => [],
 *  'groups' => [],
 *  'archives' => []
 * ]
 *  Custom title for given page type is created by concatenating all of the array 'value' parts.
 *  Tokens are replaced with their corresponding values for current site.
 *  Empty array signals that we are not overriding the default title for particular page type.
 */

/**
 * Class containing utility static methods for managing SEO custom title formats.
 */
class Jetpack_SEO_Titles {
	/**
	 * Site option name used to store custom title formats.
	 */
	const TITLE_FORMATS_OPTION = 'advanced_seo_title_formats';

	/**
	 * Retrieves custom title formats from site option.
	 *
	 * @return array Array of custom title formats, or empty array.
	 */
	public static function get_custom_title_formats() {
		if( Jetpack_SEO_Utils::is_enabled_jetpack_seo() ) {
			return get_option( self::TITLE_FORMATS_OPTION, array() );
		}

		return array();
	}

	/**
	 * Returns tokens that are currently supported for each page type.
	 *
	 * @return array Array of allowed token strings.
	 */
	public static function get_allowed_tokens() {
		return array(
			'front_page' => array( 'site_name', 'tagline' ),
			'posts'      => array( 'site_name', 'tagline', 'post_title' ),
			'pages'      => array( 'site_name', 'tagline', 'page_title' ),
			'groups'     => array( 'site_name', 'tagline', 'group_title' ),
			'archives'   => array( 'site_name', 'tagline', 'date' ),
		);
	}

	/**
	 * Used to modify the default title with custom SEO title.
	 *
	 * @param string $default_title Default title for current page.
	 *
	 * @return string Custom title with replaced tokens or default title.
	 */
	public static function get_custom_title( $default_title = '' ) {
		// Don't filter title for unsupported themes.
		if ( self::is_conflicted_theme() ) {
			return $default_title;
		}

		$page_type = self::get_page_type();

		// Keep default title if invalid page type is supplied.
		if ( empty( $page_type ) ) {
			return $default_title;
		}

		$title_formats = self::get_custom_title_formats();

		// Keep default title if user has not defined custom title for this page type.
		if ( empty( $title_formats[ $page_type ] ) ) {
			return $default_title;
		}

		if ( ! Jetpack_SEO_Utils::is_enabled_jetpack_seo() ) {
			return $default_title;
		}

		$custom_title = '';
		$format_array = $title_formats[ $page_type ];

		foreach ( $format_array as $item ) {
			if ( 'token' == $item['type'] ) {
				$custom_title .= self::get_token_value( $item['value'] );
			} else {
				$custom_title .= $item['value'];
			}
		}

		return esc_html( $custom_title );
	}

	/**
	 * Returns string value for given token.
	 *
	 * @param string $token_name The token name value that should be replaced.
	 *
	 * @return string Token replacement for current site, or empty string for unknown token name.
	 */
	public static function get_token_value( $token_name ) {

		switch ( $token_name ) {
			case 'site_name':
				return get_bloginfo( 'name' );

			case 'tagline':
				return get_bloginfo( 'description' );

			case 'post_title':
			case 'page_title':
				return get_the_title();

			case 'group_title':
				return single_tag_title( '', false );

			case 'date':
				return trim( single_month_title( ' ', false ) );

			default:
				return '';
		}
	}

	/**
	 * Returns page type for current page. We need this helper in order to determine what
	 * user defined title format should be used for custom title.
	 *
	 * @return string|bool Type of current page or false if unsupported.
	 */
	public static function get_page_type() {

		if ( is_front_page() ) {
			return 'front_page';
		}

		if ( is_category() || is_tag() ) {
			return 'groups';
		}

		if ( is_archive() && ! is_author() ) {
			return 'archives';
		}

		if ( is_page() ) {
			return 'pages';
		}

		if ( is_singular() ) {
			return 'posts';
		}

		return false;
	}

	/**
	 * Checks if current theme is defining custom title that won't work nicely
	 * with our custom SEO title override.
	 *
	 * @return bool True if current theme sets custom title, false otherwise.
	 */
	public static function is_conflicted_theme() {
		/**
		 * Can be used to specify a list of themes that use their own custom title format.
		 *
		 * If current site is using one of the themes listed as conflicting,
		 * Jetpack SEO custom title formats will be disabled.
		 *
		 * @module seo-tools
		 *
		 * @since 4.4.0
		 *
		 * @param array List of conflicted theme names. Defaults to empty array.
		 */
		$conflicted_themes = apply_filters( 'jetpack_seo_custom_title_conflicted_themes', array() );

		return isset( $conflicted_themes[ get_option( 'template' ) ] );
	}

	/**
	 * Checks if a given format conforms to predefined SEO title templates.
	 *
	 * Every format type and token must be whitelisted.
	 * @see get_allowed_tokens()
	 *
	 * @param array $title_formats Template of SEO title to check.
	 *
	 * @return bool True if the formats are valid, false otherwise.
	 */
	public static function are_valid_title_formats( $title_formats ) {
		$allowed_tokens = self::get_allowed_tokens();

		if ( ! is_array( $title_formats ) ) {
			return false;
		}

		foreach ( $title_formats as $format_type => $format_array ) {
			if ( ! in_array( $format_type, array_keys( $allowed_tokens ) ) ) {
				return false;
			}

			if ( ! is_array( $format_array ) ) {
				return false;
			}

			foreach ( $format_array as $item ) {
				if ( empty( $item['type'] ) || empty( $item['value'] ) ) {
					return false;
				}

				if ( 'token' == $item['type'] ) {
					if ( ! in_array( $item['value'], $allowed_tokens[ $format_type ] ) ) {
						return false;
					}
				}
			}
		}

		return true;
	}

	/**
	 * Combines the previous values of title formats, stored as array in site options,
	 * with the new values that are provided.
	 *
	 * @param array $new_formats Array containing new title formats.
	 *
	 * @return array $result Array of updated title formats, or empty array if no update was performed.
	 */
	public static function update_title_formats( $new_formats ) {
		// Empty array signals that custom title shouldn't be used.
		$empty_formats = array(
			'front_page' => array(),
			'posts'      => array(),
			'pages'      => array(),
			'groups'     => array(),
			'archives'   => array(),
		);

		$previous_formats = self::get_custom_title_formats();

		$result = array_merge( $empty_formats, $previous_formats, $new_formats );

		if ( update_option( self::TITLE_FORMATS_OPTION, $result ) ) {
			return $result;
		}

		return array();
	}
}
