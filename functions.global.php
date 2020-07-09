<?php
/**
 * This file is meant to be the home for any generic & reusable functions
 * that can be accessed anywhere within Jetpack.
 *
 * This file is loaded whether or not Jetpack is active.
 *
 * Please namespace with jetpack_
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Device_Detection;

/**
 * Disable direct access.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Hook into Core's _deprecated_function
 * Add more details about when a deprecated function will be removed.
 *
 * @since 8.8.0
 *
 * @param string $function    The function that was called.
 * @param string $replacement Optional. The function that should have been called. Default null.
 * @param string $version     The version of Jetpack that deprecated the function.
 */
function jetpack_deprecated_function( $function, $replacement, $version ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	// Bail early for non-Jetpack deprecations.
	if ( 0 !== strpos( $version, 'jetpack-' ) ) {
		return;
	}

	// Look for when a function will be removed based on when it was deprecated.
	$removed_version = jetpack_get_future_removed_version( $version );

	// If we could find a version, let's log a message about when removal will happen.
	if (
		! empty( $removed_version )
		&& ( defined( 'WP_DEBUG' ) && WP_DEBUG )
		/** This filter is documented in core/src/wp-includes/functions.php */
		&& apply_filters( 'deprecated_function_trigger_error', true )
	) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			sprintf(
				/* Translators: 1. Function name. 2. Jetpack version number. */
				__( 'The %1$s function will be removed from the Jetpack plugin in version %2$s.', 'jetpack' ),
				$function,
				$removed_version
			)
		);

	}
}
add_action( 'deprecated_function_run', 'jetpack_deprecated_function', 10, 3 );

/**
 * Hook into Core's _deprecated_file
 * Add more details about when a deprecated file will be removed.
 *
 * @since 8.8.0
 *
 * @param string $file        The file that was called.
 * @param string $replacement The file that should have been included based on ABSPATH.
 * @param string $version     The version of WordPress that deprecated the file.
 * @param string $message     A message regarding the change.
 */
function jetpack_deprecated_file( $file, $replacement, $version, $message ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	// Bail early for non-Jetpack deprecations.
	if ( 0 !== strpos( $version, 'jetpack-' ) ) {
		return;
	}

	// Look for when a file will be removed based on when it was deprecated.
	$removed_version = jetpack_get_future_removed_version( $version );

	// If we could find a version, let's log a message about when removal will happen.
	if (
		! empty( $removed_version )
		&& ( defined( 'WP_DEBUG' ) && WP_DEBUG )
		/** This filter is documented in core/src/wp-includes/functions.php */
		&& apply_filters( 'deprecated_file_trigger_error', true )
	) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			sprintf(
				/* Translators: 1. File name. 2. Jetpack version number. */
				__( 'The %1$s file will be removed from the Jetpack plugin in version %2$s.', 'jetpack' ),
				$file,
				$removed_version
			)
		);

	}
}
add_action( 'deprecated_file_included', 'jetpack_deprecated_file', 10, 4 );

/**
 * Get the major version number of Jetpack 6 months after provided version.
 * Useful to indicate when a deprecated function will be removed from Jetpack.
 *
 * @since 8.8.0
 *
 * @param string $version The version of WordPress that deprecated the function.
 *
 * @return bool|float Return a Jetpack Major version number, or false.
 */
function jetpack_get_future_removed_version( $version ) {
	/*
	 * Extract the version number from a deprecation notice.
	 * (let's only keep the first decimal, e.g. 8.8 and not 8.8.0)
	 */
	preg_match( '#(([0-9]+\.([0-9]+))(?:\.[0-9]+)*)#', $version, $matches );

	if ( isset( $matches[2], $matches[3] ) ) {
		$deprecated_version = (float) $matches[2];
		$deprecated_minor   = (float) $matches[3];

		/*
		 * If the detected minor version number
		 * (e.g. "7" in "8.7")
		 * is higher than 9, we know the version number is malformed.
		 * Jetpack does not use semver yet.
		 * Bail.
		 */
		if ( 10 <= $deprecated_minor ) {
			return false;
		}

		// We'll remove the function from the code 6 months later, thus 6 major versions later.
		$removed_version = $deprecated_version + 0.6;

		return (float) $removed_version;
	}

	return false;
}

/**
 * Set the admin language, based on user language.
 *
 * @since 4.5.0
 * @deprecated 6.6.0 Use Core function instead.
 *
 * @return string
 */
function jetpack_get_user_locale() {
	_deprecated_function( __FUNCTION__, 'jetpack-6.6.0', 'get_user_locale' );
	return get_user_locale();
}

/**
 * Determine if this site is an Atomic site or not looking first at the 'at_options' option.
 * As a fallback, check for presence of wpcomsh plugin to determine if a current site has undergone AT.
 *
 * @since 4.8.1
 *
 * @return bool
 */
function jetpack_is_atomic_site() {
	$at_options = get_option( 'at_options', array() );
	return ! empty( $at_options ) || defined( 'WPCOMSH__PLUGIN_FILE' );
}

/**
 * Register post type for migration.
 *
 * @since 5.2
 */
function jetpack_register_migration_post_type() {
	register_post_type(
		'jetpack_migration',
		array(
			'supports'     => array(),
			'taxonomies'   => array(),
			'hierarchical' => false,
			'public'       => false,
			'has_archive'  => false,
			'can_export'   => true,
		)
	);
}

/**
 * Stores migration data in the database.
 *
 * @since 5.2
 *
 * @param string $option_name  Option name.
 * @param bool   $option_value Option value.
 *
 * @return int|WP_Error
 */
function jetpack_store_migration_data( $option_name, $option_value ) {
	jetpack_register_migration_post_type();

	$insert = array(
		'post_title'            => $option_name,
		'post_content_filtered' => $option_value,
		'post_type'             => 'jetpack_migration',
		'post_date'             => gmdate( 'Y-m-d H:i:s', time() ),
	);

	$post = get_page_by_title( $option_name, 'OBJECT', 'jetpack_migration' );

	if ( null !== $post ) {
		$insert['ID'] = $post->ID;
	}

	return wp_insert_post( $insert, true );
}

/**
 * Retrieves legacy image widget data.
 *
 * @since 5.2
 *
 * @param string $option_name Option name.
 *
 * @return mixed|null
 */
function jetpack_get_migration_data( $option_name ) {
	$post = get_page_by_title( $option_name, 'OBJECT', 'jetpack_migration' );

	return null !== $post ? maybe_unserialize( $post->post_content_filtered ) : null;
}

/**
 * Prints a TOS blurb used throughout the connection prompts.
 *
 * @since 5.3
 *
 * @echo string
 */
function jetpack_render_tos_blurb() {
	printf(
		wp_kses(
			/* Translators: placeholders are links. */
			__( 'By clicking the <strong>Set up Jetpack</strong> button, you agree to our <a href="%1$s" target="_blank" rel="noopener noreferrer">Terms of Service</a> and to <a href="%2$s" target="_blank" rel="noopener noreferrer">share details</a> with WordPress.com.', 'jetpack' ),
			array(
				'a'      => array(
					'href'   => array(),
					'target' => array(),
					'rel'    => array(),
				),
				'strong' => true,
			)
		),
		esc_url( Redirect::get_url( 'wpcom-tos' ) ),
		esc_url( Redirect::get_url( 'jetpack-support-what-data-does-jetpack-sync' ) )
	);
}

/**
 * Intervene upgrade process so Jetpack themes are downloaded with credentials.
 *
 * @since 5.3
 *
 * @param bool   $preempt Whether to preempt an HTTP request's return value. Default false.
 * @param array  $r       HTTP request arguments.
 * @param string $url     The request URL.
 *
 * @return array|bool|WP_Error
 */
function jetpack_theme_update( $preempt, $r, $url ) {
	if ( false !== stripos( $url, JETPACK__WPCOM_JSON_API_HOST . '/rest/v1/themes/download' ) ) {
		$file = $r['filename'];
		if ( ! $file ) {
			return new WP_Error( 'problem_creating_theme_file', esc_html__( 'Problem creating file for theme download', 'jetpack' ) );
		}
		$theme = pathinfo( wp_parse_url( $url, PHP_URL_PATH ), PATHINFO_FILENAME );

		// Remove filter to avoid endless loop since wpcom_json_api_request_as_blog uses this too.
		remove_filter( 'pre_http_request', 'jetpack_theme_update' );
		$result = Client::wpcom_json_api_request_as_blog(
			"themes/download/$theme.zip",
			'1.1',
			array(
				'stream'   => true,
				'filename' => $file,
			)
		);

		if ( 200 !== wp_remote_retrieve_response_code( $result ) ) {
			return new WP_Error( 'problem_fetching_theme', esc_html__( 'Problem downloading theme', 'jetpack' ) );
		}
		return $result;
	}
	return $preempt;
}

/**
 * Add the filter when a upgrade is going to be downloaded.
 *
 * @since 5.3
 *
 * @param bool $reply Whether to bail without returning the package. Default false.
 *
 * @return bool
 */
function jetpack_upgrader_pre_download( $reply ) {
	add_filter( 'pre_http_request', 'jetpack_theme_update', 10, 3 );
	return $reply;
}

add_filter( 'upgrader_pre_download', 'jetpack_upgrader_pre_download' );


/**
 * Wraps data in a way so that we can distinguish between objects and array and also prevent object recursion.
 *
 * @since 6.1.0
 *
 * @param array|obj $any        Source data to be cleaned up.
 * @param array     $seen_nodes Built array of nodes.
 *
 * @return array
 */
function jetpack_json_wrap( &$any, $seen_nodes = array() ) {
	if ( is_object( $any ) ) {
		$input        = get_object_vars( $any );
		$input['__o'] = 1;
	} else {
		$input = &$any;
	}

	if ( is_array( $input ) ) {
		$seen_nodes[] = &$any;

		$return = array();

		foreach ( $input as $k => &$v ) {
			if ( ( is_array( $v ) || is_object( $v ) ) ) {
				if ( in_array( $v, $seen_nodes, true ) ) {
					continue;
				}
				$return[ $k ] = jetpack_json_wrap( $v, $seen_nodes );
			} else {
				$return[ $k ] = $v;
			}
		}

		return $return;
	}

	return $any;
}

/**
 * Checks if the mime_content_type function is available and return it if so.
 *
 * The function mime_content_type is enabled by default in PHP, but can be disabled. We attempt to
 * enforce this via composer.json, but that won't be checked in majority of cases where
 * this would be happening.
 *
 * @since 7.8.0
 *
 * @param string $file File location.
 *
 * @return string|false MIME type or false if functionality is not available.
 */
function jetpack_mime_content_type( $file ) {
	if ( function_exists( 'mime_content_type' ) ) {
		return mime_content_type( $file );
	}

	return false;
}

/**
 * Checks that the mime type of the specified file is among those in a filterable list of mime types.
 *
 * @since 7.8.0
 *
 * @param string $file Path to file to get its mime type.
 *
 * @return bool
 */
function jetpack_is_file_supported_for_sideloading( $file ) {
	$type = jetpack_mime_content_type( $file );

	if ( ! $type ) {
		return false;
	}

	/**
	 * Filter the list of supported mime types for media sideloading.
	 *
	 * @since 4.0.0
	 *
	 * @module json-api
	 *
	 * @param array $supported_mime_types Array of the supported mime types for media sideloading.
	 */
	$supported_mime_types = apply_filters(
		'jetpack_supported_media_sideload_types',
		array(
			'image/png',
			'image/jpeg',
			'image/gif',
			'image/bmp',
			'video/quicktime',
			'video/mp4',
			'video/mpeg',
			'video/ogg',
			'video/3gpp',
			'video/3gpp2',
			'video/h261',
			'video/h262',
			'video/h264',
			'video/x-msvideo',
			'video/x-ms-wmv',
			'video/x-ms-asf',
		)
	);

	// If the type returned was not an array as expected, then we know we don't have a match.
	if ( ! is_array( $supported_mime_types ) ) {
		return false;
	}

	return in_array( $type, $supported_mime_types, true );
}

/**
 * Determine if the current User Agent matches the passed $kind
 *
 * @param string $kind Category of mobile device to check for.
 *                         Either: any, dumb, smart.
 * @param bool   $return_matched_agent Boolean indicating if the UA should be returned.
 *
 * @return bool|string Boolean indicating if current UA matches $kind. If
 *                              $return_matched_agent is true, returns the UA string
 */
function jetpack_is_mobile( $kind = 'any', $return_matched_agent = false ) {

	/**
	 * Filter the value of jetpack_is_mobile before it is calculated.
	 *
	 * Passing a truthy value to the filter will short-circuit determining the
	 * mobile type, returning the passed value instead.
	 *
	 * @since  4.2.0
	 *
	 * @param bool|string $matches Boolean if current UA matches $kind or not. If
	 *                             $return_matched_agent is true, should return the UA string
	 * @param string      $kind Category of mobile device being checked
	 * @param bool        $return_matched_agent Boolean indicating if the UA should be returned
	 */
	$pre = apply_filters( 'pre_jetpack_is_mobile', null, $kind, $return_matched_agent );
	if ( $pre ) {
		return $pre;
	}

	$return      = false;
	$device_info = Device_Detection::get_info();

	if ( 'any' === $kind ) {
		$return = $device_info['is_phone'];
	} elseif ( 'smart' === $kind ) {
		$return = $device_info['is_smartphone'];
	} elseif ( 'dumb' === $kind ) {
		$return = $device_info['is_phone'] && ! $device_info['is_smartphone'];
	}

	if ( $return_matched_agent && true === $return ) {
		$return = $device_info['is_phone_matched_ua'];
	}

	/**
	 * Filter the value of jetpack_is_mobile
	 *
	 * @since  4.2.0
	 *
	 * @param bool|string $matches Boolean if current UA matches $kind or not. If
	 *                             $return_matched_agent is true, should return the UA string
	 * @param string      $kind Category of mobile device being checked
	 * @param bool        $return_matched_agent Boolean indicating if the UA should be returned
	 */
	return apply_filters( 'jetpack_is_mobile', $return, $kind, $return_matched_agent );
}
