<?php
/**
 * WPCOMSH functions file.
 *
 * @package wpcomsh
 */

/**
 * Whether the theme is a wpcom theme.
 *
 * @param string $theme_slug Theme slug.
 * @return bool
 */
function wpcomsh_is_wpcom_theme( $theme_slug ) {
	return wpcomsh_is_wpcom_premium_theme( $theme_slug ) || wpcomsh_is_wpcom_pub_theme( $theme_slug );
}

/**
 * Whether the theme is a premium wpcom theme.
 *
 * @param string $theme_slug Theme slug.
 * @return bool
 */
function wpcomsh_is_wpcom_premium_theme( $theme_slug ) {
	if (
		! defined( 'WPCOMSH_PREMIUM_THEMES_PATH' ) ||
		! file_exists( WPCOMSH_PREMIUM_THEMES_PATH )
	) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions
		error_log(
			"WPComSH: WPCom premium themes folder couldn't be located. " .
			'Check whether the ' . WPCOMSH_PREMIUM_THEMES_PATH . ' constant points to the correct directory.'
		);

		return false;
	}

	return file_exists(
		WPCOMSH_PREMIUM_THEMES_PATH . "/{$theme_slug}"
	);
}

/**
 * Whether the theme is a free wpcom theme.
 *
 * @param string $theme_slug Theme slug.
 * @return bool
 */
function wpcomsh_is_wpcom_pub_theme( $theme_slug ) {
	if (
		! defined( 'WPCOMSH_PUB_THEMES_PATH' ) ||
		! file_exists( WPCOMSH_PUB_THEMES_PATH )
	) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions
		error_log(
			"WPComSH: WPCom pub themes folder couldn't be located. " .
			'Check whether the ' . WPCOMSH_PUB_THEMES_PATH . ' constant points to the correct directory.'
		);

		return false;
	}

	return file_exists(
		WPCOMSH_PUB_THEMES_PATH . "/{$theme_slug}"
	);
}

/**
 * Symlinks a wpcom theme.
 *
 * @param string $theme_slug Theme slug.
 * @param string $theme_type Type of theme.
 * @return bool|WP_Error
 */
function wpcomsh_symlink_theme( $theme_slug, $theme_type ) {
	/**
	 * We need to read from the themes_path constants and create the symlink using the themes_symlink constant.
	 *
	 * More context here:
	 * - p1487627624008111-slack-C2PDURDSL
	 * - p1713351585355929-slack-C7YPW6K40
	 */
	$theme_link_to_path = get_theme_root() . '/' . $theme_slug;
	$theme_read_path    = '';
	$theme_symlink_path = '';
	if ( WPCOMSH_PUB_THEME_TYPE === $theme_type ) {
		$theme_read_path    = WPCOMSH_PUB_THEMES_PATH . "/$theme_slug";
		$theme_symlink_path = WPCOMSH_PUB_THEMES_SYMLINK . "/$theme_slug";
	} elseif ( WPCOMSH_PREMIUM_THEME_TYPE === $theme_type ) {
		$theme_read_path    = WPCOMSH_PREMIUM_THEMES_PATH . "/$theme_slug";
		$theme_symlink_path = WPCOMSH_PREMIUM_THEMES_SYMLINK . "/$theme_slug";
	}

	if ( file_exists( $theme_read_path ) && symlink( $theme_symlink_path, $theme_link_to_path ) ) {
		return true;
	}

	$error_message = "Could not install theme $theme_slug.";
	$debug_message = "$error_message Read directory: $theme_read_path, symlink directory: $theme_symlink_path, link to: $theme_link_to_path.";

	error_log( 'WPComSH: ' . $debug_message ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions

	return new WP_Error( 'error_symlinking_theme', $error_message );
}

/**
 * Deletes cache of the passed theme.
 *
 * @param string $theme_slug Optional. Slug of the theme to delete cache for.
 *                           Default: Current theme.
 */
function wpcomsh_delete_theme_cache( $theme_slug = null ) {
	$theme = wp_get_theme( $theme_slug );

	if ( $theme instanceof WP_Theme ) {
		$theme->cache_delete();
	}
}

/**
 * Checks whether a theme (by theme slug) is symlinked in the themes' directory.
 *
 * @param string $theme_slug The slug of a theme.
 * @return bool Whether a theme is symlinked in the themes' directory.
 */
function wpcomsh_is_theme_symlinked( $theme_slug ) {
	$theme_root  = get_theme_root();
	$theme_dir   = "$theme_root/$theme_slug";
	$site_themes = scandir( $theme_root );

	return in_array( $theme_slug, $site_themes, true ) && is_link( $theme_dir );
}

/**
 * Deletes a symlinked theme.
 *
 * @param string $theme_slug The slug of a theme.
 * @return bool|WP_Error True on success, WP_Error on error.
 */
function wpcomsh_delete_symlinked_theme( $theme_slug ) {
	$theme_dir = get_theme_root() . "/$theme_slug";

	if ( file_exists( $theme_dir ) && is_link( $theme_dir ) ) {
		unlink( $theme_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink

		return true;
	}

	// phpcs:ignore WordPress.PHP.DevelopmentFunctions
	error_log(
		"WPComSH: Can't delete the specified symlinked theme: the path or symlink doesn't exist."
	);

	return new WP_Error(
		'error_deleting_symlinked_theme',
		"Can't delete the specified symlinked theme: the path or symlink doesn't exist."
	);
}

/**
 * Returns a theme type.
 *
 * @param string $theme_slug The slug of a theme.
 * @return false|string Theme type or false if not a wpcom theme.
 */
function wpcomsh_get_wpcom_theme_type( $theme_slug ) {
	if ( wpcomsh_is_wpcom_premium_theme( $theme_slug ) ) {
		return WPCOMSH_PREMIUM_THEME_TYPE;
	} elseif ( wpcomsh_is_wpcom_pub_theme( $theme_slug ) ) {
		return WPCOMSH_PUB_THEME_TYPE;
	}

	return false;
}

/**
 * Returns whether the theme is a child theme.
 *
 * @param string $theme_slug Slug of the theme to check. Default: Active theme.
 * @return bool
 */
function wpcomsh_is_wpcom_child_theme( $theme_slug = null ) {
	$theme = wp_get_theme( $theme_slug );

	return $theme->get_stylesheet() !== $theme->get_template();
}

/**
 * Count the number of child themes with the specified template.
 *
 * @param string $template The theme template name.
 *
 * @return int
 */
function wpcomsh_count_child_themes( $template ) {
	$child_count = 0;

	foreach ( wp_get_themes() as $theme ) {
		if (
			$theme->get_template() === $template &&
			$theme->get_stylesheet() !== $theme->get_template()
		) {
			++$child_count;
		}
	}

	return $child_count;
}

/**
 * Symlinks the theme's parent if it's a child theme.
 *
 * @param string $stylesheet Theme slug.
 * @return bool|WP_Error
 */
function wpcomsh_symlink_parent_theme( $stylesheet ) {
	$theme    = wp_get_theme( $stylesheet );
	$template = $theme->get_template();

	if ( $template === $stylesheet ) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions
		error_log( "WPComSH: Can't symlink parent theme. Current theme is not a child theme." );

		return false;
	}

	// phpcs:ignore WordPress.PHP.DevelopmentFunctions
	error_log( 'WPComSH: Symlinking parent theme.' );

	return wpcomsh_symlink_theme( $template, wpcomsh_get_wpcom_theme_type( $template ) );
}

/**
 * Returns the Atomic site ID.
 *
 * @return int
 */
function wpcomsh_get_atomic_site_id() {
	if ( defined( 'ATOMIC_SITE_ID' ) ) {
		return (int) ATOMIC_SITE_ID;
	}

	$atomic_site_id = apply_filters( 'wpcomsh_get_atomic_site_id', 0 );
	if ( ! empty( $atomic_site_id ) ) {
		return (int) $atomic_site_id;
	}

	return 0;
}

/**
 * Returns the Atomic client ID.
 *
 * @return int
 */
function wpcomsh_get_atomic_client_id() {
	if ( defined( 'ATOMIC_CLIENT_ID' ) ) {
		return (int) ATOMIC_CLIENT_ID;
	}

	$atomic_client_id = apply_filters( 'wpcomsh_get_atomic_client_id', 0 );
	if ( ! empty( $atomic_client_id ) ) {
		return (int) $atomic_client_id;
	}

	return 0;
}

/**
 * Returns an array of active WordPress.com subscriptions. The array keys are the product slugs.
 *
 * @return array
 */
function wpcomsh_get_wpcom_active_subscriptions() {
	$persistent_data = new Atomic_Persistent_Data();

	if ( ! $persistent_data || ! $persistent_data->WPCOM_PURCHASES ) { // phpcs:ignore WordPress.NamingConventions
		return array();
	}

	$wpcom_purchases = json_decode( $persistent_data->WPCOM_PURCHASES ); // phpcs:ignore WordPress.NamingConventions

	// If ( for any reason ) $wpcom_purchases is not an array, return early an empty array so that array_reduce doesn't throw an error.
	if ( ! is_array( $wpcom_purchases ) ) {
		return array();
	}

	return array_reduce(
		$wpcom_purchases,
		function ( $assoc_array, $purchase ) {
			/**
			 * Check if the billing_product_slug exists, if not, revert to parsing the store product slug.
			 * This happens for sites that don't have the APD updated to the new format.
			 */
			if ( isset( $purchase->billing_product_slug ) ) {
				$product_slug = $purchase->billing_product_slug;
			} else {
				// 1. Remove _monthly or _yearly ( mainly found in marketplace plugins ).
				// 2. Transform to product slug pattern with dashes (billing product slug).
				$product_slug = preg_replace( array( '/(_monthly|_yearly)$/', '/_/' ), array( '', '-' ), $purchase->product_slug );
			}

			$assoc_array[ $product_slug ] = $purchase;

			return $assoc_array;
		},
		array()
	);
}
add_filter( 'pre_option_wpcom_active_subscriptions', 'wpcomsh_get_wpcom_active_subscriptions' );

/**
 * Get Atomic site information.
 *
 * @return array
 */
function wpcomsh_get_at_site_info() {
	$at_site_info_file = sys_get_temp_dir() . '/.at-site-info';

	if ( ! is_file( $at_site_info_file ) ) {
		return array();
	}

	$site_info_json = file_get_contents( $at_site_info_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions

	if ( empty( $site_info_json ) ) {
		return array();
	}

	$site_info = json_decode( $site_info_json, true );
	if ( empty( $site_info ) ) {
		return array();
	}

	return $site_info;
}

/**
 * Whether the current request is an XML-RPC request from Calypso to install a theme or plugin.
 *
 * @param string $path_regex Regular expression of paths to allow.
 * @return bool
 */
function wpcomsh_is_xmlrpc_request_matching( $path_regex ) {
	// Return early for all non-API requests.
	if ( ! defined( 'REST_API_REQUEST' ) || ! REST_API_REQUEST ) {
		return false;
	}

	// Return early-ish when it's not a verified XML-RPC request.
	if (
		! method_exists( 'Automattic\Jetpack\Connection\Manager', 'verify_xml_rpc_signature' ) ||
		! ( new Automattic\Jetpack\Connection\Manager() )->verify_xml_rpc_signature() ) {
		return false;
	}

	return class_exists( 'WPCOM_JSON_API' ) && preg_match( $path_regex, WPCOM_JSON_API::$self->path );
}

/**
 * Check if we are handling a WordPress core REST v2 API request where the API path matches
 * the regular expression in $path_regex and the HTTP method(s) in $request_method.
 *
 * @param string          $path_regex      A regular expression for the requested path, which should include the REST prefix available from {@see rest_get_url_prefix()}.
 * @param string|string[] $request_method  The expected HTTP method(s) of the request, e.g. GET|POST|PUT|DELETE or array( 'PUT', 'POST' ).
 * @return bool                            Whether the incoming request matches the supplied path and method(s).
 */
function wpcomsh_is_wp_rest_request_matching( $path_regex, $request_method = 'GET' ) {
	if ( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) {
		return false;
	}

	$request_methods = is_array( $request_method ) ? $request_method : array( $request_method );

	if ( ! isset( $_SERVER['REQUEST_METHOD'] ) || ! in_array( $_SERVER['REQUEST_METHOD'], $request_methods, true ) ) {
		return false;
	}

	if ( ! isset( $_SERVER['REQUEST_URI'] ) ) {
		return false;
	}

	$rest_path = esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) );

	return 1 === preg_match( $path_regex, $rest_path );
}

/**
 * Returns the map provider the map block should use.
 *
 * @return string
 */
function wpcomsh_map_block_map_provider() {
	return 'mapkit';
}

add_filter( 'wpcom_map_block_map_provider', 'wpcomsh_map_block_map_provider', 10, 0 );

/**
 * Disabled fatal error emails if the option is set.
 *
 * @param array $email The email arguments.
 *
 * @return array The email arguments.
 */
function wpcomsh_disable_fatal_error_emails( $email ) {
	if ( get_option( 'wpcomsh_disable_fatal_error_emails', false ) ) {
		$email['to'] = '';
	}
	return $email;
}

add_filter( 'recovery_mode_email', 'wpcomsh_disable_fatal_error_emails' );

/**
 * Returns the location where newsletter categories should appear
 *
 * @return string
 */
function wpcomsh_newsletter_categories_location() {
	return 'modal';
}

add_filter( 'wpcom_newsletter_categories_location', 'wpcomsh_newsletter_categories_location', 10, 0 );

/**
 * Enables new likes layout on Atomic.
 */
add_filter( 'likes_new_layout', '__return_true' );
