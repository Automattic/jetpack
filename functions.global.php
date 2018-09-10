<?php
/**
 * This file is meant to be the home for any generic & reusable functions
 * that can be accessed anywhere within Jetpack.
 *
 * This file is loaded whether or not Jetpack is active.
 *
 * Please namespace with jetpack_
 * Please write docblocks
 */

/**
 * Disable direct access.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
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
	register_post_type( 'jetpack_migration', array(
		'supports'     => array(),
		'taxonomies'   => array(),
		'hierarchical' => false,
		'public'       => false,
		'has_archive'  => false,
		'can_export'   => true,
	) );
}

/**
 * Stores migration data in the database.
 *
 * @since 5.2
 *
 * @param string $option_name
 * @param bool $option_value
 *
 * @return int|WP_Error
 */
function jetpack_store_migration_data( $option_name, $option_value ) {
	jetpack_register_migration_post_type();

	$insert = array(
		'post_title' => $option_name,
		'post_content_filtered' => $option_value,
		'post_type' => 'jetpack_migration',
		'post_date' => date( 'Y-m-d H:i:s', time() ),
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
 * @param string $option_name
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
 * @return string
 */
function jetpack_render_tos_blurb() {
	printf(
		__( 'By clicking the <strong>Set up Jetpack</strong> button, you agree to our <a href="%s" target="_blank">Terms of Service</a> and to <a href="%s" target="_blank">share details</a> with WordPress.com.', 'jetpack' ),
		'https://wordpress.com/tos',
		'https://jetpack.com/support/what-data-does-jetpack-sync'
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
		$theme = pathinfo( parse_url( $url, PHP_URL_PATH ), PATHINFO_FILENAME );

		// Remove filter to avoid endless loop since wpcom_json_api_request_as_blog uses this too.
		remove_filter( 'pre_http_request', 'jetpack_theme_update' );
		$result = Jetpack_Client::wpcom_json_api_request_as_blog(
			"themes/download/$theme.zip", '1.1', array( 'stream' => true, 'filename' => $file )
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
 * @param $any
 * @param array $seen_nodes
 *
 * @return array
 */
function jetpack_json_wrap( &$any, $seen_nodes = array() ) {
	if ( is_object( $any ) ) {
		$input = get_object_vars( $any );
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
