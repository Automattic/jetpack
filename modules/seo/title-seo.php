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
 * Returns tokens that are currently supported for each page type.
 *
 * @return array Array of allowed token strings.
 */
function get_allowed_tokens() {
	return array(
		'front_page' => [ 'site_name', 'tagline' ],
		'posts'      => [ 'site_name', 'tagline', 'post_title' ],
		'pages'      => [ 'site_name', 'tagline', 'page_title' ],
		'groups'     => [ 'site_name', 'tagline', 'group_title' ],
		'archives'   => [ 'site_name', 'tagline', 'date' ],
	);
}

/**
 * Used to modify the default title with custom SEO title.
 *
 * @param string $default_title Default title for current page.
 *
 * @return string Custom title with replaced tokens or default title.
 */
function get_custom_title( $default_title = '' ) {
	// Don't filter title for unsupported themes
	if ( is_conflicted_theme() ) {
		return $default_title;
	}

	$page_type = get_page_type();

	// Keep default title if invalid page type is supplied
	if ( empty( $page_type ) ) {
		return $default_title;
	}

	$title_formats = get_option( 'advanced_seo_title_formats' );

	// Keep default title if user has not defined custom title for this page type
	if ( empty( $title_formats[ $page_type ] ) ) {
		return $default_title;
	}

	if ( ! is_enabled_advanced_seo() ) {
		return $default_title;
	}

	$custom_title = array_reduce( $title_formats[ $page_type ], function ( $title, $item ) {
		return $title .= ( 'token' === $item['type'] )
			? get_token_value( $item['value'] )
			: $item['value'];
	}, '' );

	return esc_html( $custom_title );
}

/**
 * Returns string value for given token.
 *
 * @param string $token_name The token name value that should be replaced.
 *
 * @return string Token replacement for current site, or empty string for unknown token name.
 */
function get_token_value( $token_name ) {

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
function get_page_type() {

	if ( is_front_page() ) {
		return 'front_page';
	}

	if ( is_category() or is_tag() ) {
		return 'groups';
	}

	if ( is_archive() ) {
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
function is_conflicted_theme() {
	$conflicted_themes = array(
		'premium/eight'         => true,
		'premium/just-desserts' => true,
		'premium/on-demand'     => true,
		'premium/pinboard'      => true,
		'premium/react'         => true,
		'premium/shelf'         => true,
		'premium/simfo'         => true,
		'premium/standard'      => true,
		'premium/traction'      => true,
		'premium/designfolio'   => true,
		'premium/gigawatt'      => true,
		'premium/gridspace'     => true,
		'premium/blog-simple'   => true,
		'premium/everyday'      => true,
		'premium/elemin'        => true,
		'premium/basic-maths'   => true,
		'premium/funki'         => true,
		'pub/sidespied'         => true,
		'pub/newsworthy'        => true,
		'pub/hum'               => true,
		'pub/twentyten'         => true,
		'pub/twentyeleven'      => true,
	);

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
function are_valid_title_formats( $title_formats ) {
	$allowed_tokens = get_allowed_tokens();

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
			if ( empty( $item['type'] ) or empty( $item['value'] ) ) {
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
 * @return array $result Array of sanitized updated title formats.
 */
function update_title_formats( $new_formats ) {
	// Empty array signals that custom title shouldn't be used
	$empty_formats = array(
		'front_page' => [],
		'posts'      => [],
		'pages'      => [],
		'groups'     => [],
		'archives'   => [],
	);

	$previous_formats = get_option( 'advanced_seo_title_formats', array() );
	
	return array_merge( $empty_formats, $previous_formats, $new_formats );
}
