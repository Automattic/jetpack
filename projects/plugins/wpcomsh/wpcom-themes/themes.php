<?php
/**
 * Registers a filter for the themes API result to add WPCom themes.
 *
 * @package wpcom-themes
 */

/**
 * Loads the WPCom themes service instance.
 *
 * @return WPCom_Themes_Service
 */
function wpcomsh_get_wpcom_themes_service_instance(): WPCom_Themes_Service {
	static $instance;
	if ( ! $instance ) {
		// Load dependencies.
		require_once __DIR__ . '/includes/class-wpcom-themes-merger.php';
		require_once __DIR__ . '/includes/class-wpcom-themes-service.php';

		// Resolve and Inject dependencies.
		$mapper               = new WPCom_Themes_Mapper();
		$merger               = new WPCom_Themes_Merger();
		$cache                = new WPCom_Themes_Cache();
		$api                  = new WPCom_Themes_Api( $cache );
		$wpcom_themes_service = new WPCom_Themes_Service( $api, $mapper, $merger );

		$instance = $wpcom_themes_service;
	}

	return $instance;
}

/**
 * Perform necessary checks to remove dot org themes based on the plan and other features.
 *
 * @param mixed $res The result object.
 *
 * @return mixed|stdClass
 */
function wpcomsh_remove_dot_org_themes_based_on_plan( $res ) {
	if ( wpcom_site_has_feature( WPCOM_Features::COMMUNITY_THEMES ) ) {
		return $res;
	}

	return wpcomsh_keep_only_wpcom_themes( $res );
}
add_filter( 'themes_api_result', 'wpcomsh_remove_dot_org_themes_based_on_plan', 0, 1 );

/**
 * Drops the themes that came from WordPress.org out of a themes API result.
 *
 * @param mixed $res The result object.
 *
 * @return mixed|stdClass
 */
function wpcomsh_keep_only_wpcom_themes( $res ) {
	// A single theme's details, rather than a list to filter.
	if ( ! isset( $res->themes ) || ! is_array( $res->themes ) ) {
		return $res;
	}

	$ours = array_values(
		array_filter(
			$res->themes,
			function ( $theme ) {
				return ! empty( $theme->is_wpcom_theme );
			}
		)
	);

	// Our own themes are already the ones this site may install, and the total counts every page
	// rather than this one, so a result made of them is left as it is.
	if ( count( $ours ) === count( $res->themes ) ) {
		return $res;
	}

	/*
	 * The rest came from WordPress.org, which this plan excludes. Clearing the total as well lets
	 * the filters that run next set it from their own list, which is what they expect.
	 */
	$res->themes = $ours;

	if ( isset( $res->info['results'] ) ) {
		$res->info['results'] = count( $ours );
	}

	return $res;
}

/**
 * Process the themes API result and add the recommended WPCom themes to the Popular tab.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass
 */
function wpcomsh_popular_wpcom_themes_api_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	$browse = $args->browse ?? '';
	if ( 'query_themes' !== $action || 'popular' !== $browse ) {
		return $res;
	}

	$wpcom_themes_service = wpcomsh_get_wpcom_themes_service_instance();

	// Add results to the resulting array.
	return $wpcom_themes_service->filter_themes_api_result_recommended( $res );
}
add_filter( 'themes_api_result', 'wpcomsh_popular_wpcom_themes_api_result', 1, 3 );

/**
 * Process the themes API result and add the latest WPCom themes to the Latest tab.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass
 */
function wpcomsh_latest_wpcom_themes_api_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	$browse = $args->browse ?? '';
	if ( 'query_themes' !== $action || 'new' !== $browse ) {
		return $res;
	}

	$wpcom_themes_service = wpcomsh_get_wpcom_themes_service_instance();

	// Add results to the resulting array.
	return $wpcom_themes_service->filter_themes_api_result_latest( $res );
}
add_filter( 'themes_api_result', 'wpcomsh_latest_wpcom_themes_api_result', 1, 3 );

/**
 * Process the themes API result and add the WPCom block themes to the Block themes tab.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass
 */
function wpcomsh_block_themes_wpcom_themes_api_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	$tag = $args->tag ?? '';
	if ( 'query_themes' !== $action || 'full-site-editing' !== $tag ) {
		return $res;
	}

	$wpcom_themes_service = wpcomsh_get_wpcom_themes_service_instance();

	// Add results to the resulting array.
	return $wpcom_themes_service->filter_themes_api_result_block_themes( $res );
}
add_filter( 'themes_api_result', 'wpcomsh_block_themes_wpcom_themes_api_result', 1, 3 );

/**
 * Process the themes API result and add WPCom themes when using the search.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass
 */
function wpcomsh_search_wpcom_themes_api_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	$search = $args->search ?? '';
	if ( 'query_themes' !== $action || '' === $search ) {
		return $res;
	}

	$wpcom_themes_service = wpcomsh_get_wpcom_themes_service_instance();

	// Add results to the resulting array.
	return $wpcom_themes_service->filter_themes_api_result_search( $res, $search, wpcomsh_search_prefers_wporg() );
}
add_filter( 'themes_api_result', 'wpcomsh_search_wpcom_themes_api_result', 1, 3 );

/**
 * Whether search shows WordPress.org's copy of a theme both directories list, rather than ours.
 *
 * Only behind the Marketplace tab's flag, and only where the plan shows WordPress.org's themes:
 * elsewhere ours is the only copy the search can show.
 *
 * @return bool
 */
function wpcomsh_search_prefers_wporg(): bool {
	return function_exists( 'wpcom_themes_tab_enabled' )
		&& wpcom_themes_tab_enabled()
		&& wpcom_site_has_feature( WPCOM_Features::COMMUNITY_THEMES );
}

/**
 * Process the themes API result and add WPCom themes when using the filter feature.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass
 */
function wpcomsh_feature_filter_wpcom_themes_api_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	$tags = $args->tag ?? array();
	if ( 'query_themes' !== $action || ! $tags ) {
		return $res;
	}

	if ( ! is_array( $tags ) ) {
		$tags = array( $tags );
	}

	$wpcom_themes_service = wpcomsh_get_wpcom_themes_service_instance();

	// Add results to the resulting array.
	return $wpcom_themes_service->filter_themes_api_result_feature_filter( $res, $tags );
}
add_filter( 'themes_api_result', 'wpcomsh_feature_filter_wpcom_themes_api_result', 1, 3 );

/**
 * Process the themes API result theme_information for WPCom themes if needed.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass|WP_Error|null
 */
function wpcomsh_theme_information_wpcom_themes_api_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	if ( 'theme_information' !== $action ) {
		return $res;
	}

	$wpcom_themes_service = wpcomsh_get_wpcom_themes_service_instance();

	return $wpcom_themes_service->get_theme( $args->slug ) ?? $res;
}
add_filter( 'themes_api_result', 'wpcomsh_theme_information_wpcom_themes_api_result', 1, 3 );

/**
 * Remove the WP_Error object from the WP_Error object.
 *
 * @param string   $code    The error code.
 * @param string   $message The error message.
 * @param mixed    $data    The error data.
 * @param WP_Error $error   The WP_Error object.
 *
 * @return void
 */
function wpcomsh_remove_symlink_wp_error( $code, $message, $data, WP_Error $error ) {
	if ( 'wpcomsh_theme_install_symlink' === $code ) {
		$error->remove( 'wpcomsh_theme_install_symlink' );
	}
}

/**
 * Install WPCom themes by creating a symlink instead of downloading the theme package.
 *
 * @param mixed  $reply    The result object.
 * @param string $package  The package to install.
 * @param mixed  $upgrader The upgrader component.
 *
 * @return bool|mixed|WP_Error
 */
function wpcomsh_theme_install_by_symlink( $reply, $package, $upgrader ) {
	// Pre-requisites checks. A WP.com theme's package is its slug; a URL or file path is some other theme.
	if ( ! $package || ! is_string( $package ) || str_contains( $package, '/' ) || ! $upgrader instanceof Theme_Upgrader ) {
		return $reply;
	}

	$wpcom_themes_service = wpcomsh_get_wpcom_themes_service_instance();
	$wpcom_theme          = $wpcom_themes_service->get_theme( $package );

	if ( ! $wpcom_theme ) {
		return $reply;
	}

	$theme_type = wpcomsh_get_wpcom_theme_type( $wpcom_theme->slug );

	// WP Cloud doesn't host it, so wpcomsh_theme_install_by_download() gets it instead.
	if ( ! $theme_type ) {
		return $reply;
	}

	$upgrader->skin->feedback( 'installing_package' );
	$result = wpcomsh_install_managed_theme( $wpcom_theme->slug, $theme_type );

	if ( is_wp_error( $result ) && $result->get_error_code() !== 'wpcom_theme_already_installed' ) {
		$upgrader->skin->feedback( 'process_failed' );
		// The internal state and return values are WP_Errors.
		$upgrader->result = $result;

		return $result;
	}

	// Set the result to the theme slug to indicate success and so that the skin can reference it.
	$result           = array(
		'destination_name' => $wpcom_theme->slug,
	);
	$upgrader->result = $result;
	// Skin uses both the upgrader and its own result which should be the same.
	$upgrader->skin->result = $result;
	$upgrader->skin->feedback( 'process_success' );

	// Symlink errors are not really errors so let's remove them. Some clients inspect the skin errors to determine the success of the operation.
	add_action( 'wp_error_added', 'wpcomsh_remove_symlink_wp_error', 0, 4 );

	// We need to return a WP_Error to short circuit the installation process.
	return new WP_Error( 'wpcomsh_theme_install_symlink' );
}
add_filter( 'upgrader_pre_download', 'wpcomsh_theme_install_by_symlink', 0, 4 );

/**
 * Install WPCom themes WP Cloud doesn't host by handing core their download, which it unpacks and installs.
 *
 * @param mixed  $reply    The result object.
 * @param string $package  The package to install.
 * @param mixed  $upgrader The upgrader component.
 *
 * @return mixed|string|WP_Error The downloaded package's path, or why there is none.
 */
function wpcomsh_theme_install_by_download( $reply, $package, $upgrader ) {
	if ( false !== $reply || ! $package || ! is_string( $package ) || str_contains( $package, '/' ) || ! $upgrader instanceof Theme_Upgrader ) {
		return $reply;
	}

	$wpcom_theme = wpcomsh_get_wpcom_themes_service_instance()->get_theme( $package );
	if ( ! $wpcom_theme ) {
		return $reply;
	}

	$download_link = wpcomsh_get_marketplace_theme_download_link( $wpcom_theme->slug );
	if ( '' === $download_link ) {
		return new WP_Error( 'wpcom_theme_not_installable', __( 'This theme could not be installed.', 'wpcomsh' ) );
	}

	return download_url( $download_link );
}
add_filter( 'upgrader_pre_download', 'wpcomsh_theme_install_by_download', 1, 4 );

/**
 * Where to download a marketplace theme this site owns, which WordPress.com lists only for owned themes.
 *
 * @param string $slug Theme slug.
 *
 * @return string The download link, empty when WordPress.com offers none for this site.
 */
function wpcomsh_get_marketplace_theme_download_link( string $slug ): string {
	$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog( '/marketplace/themes/updates', '2', array(), null, 'wpcom' );
	if ( is_wp_error( $response ) ) {
		return '';
	}

	$body = json_decode( wp_remote_retrieve_body( $response ), true );
	foreach ( $body['updates'] ?? array() as $update ) {
		if ( is_array( $update ) && ( $update['slug'] ?? '' ) === $slug && ! empty( $update['download_link'] ) ) {
			return (string) $update['download_link'];
		}
	}

	return '';
}

/**
 * Remove the symlink created for the WPCom theme when the theme is deleted.
 *
 * @param string $stylesheet The theme stylesheet.
 *
 * @return void Return early if the theme is not a WPCom theme.
 */
function wpcomsh_delete_managed_wpcom_theme( string $stylesheet ) {
	if ( wpcomsh_is_theme_symlinked( $stylesheet ) ) {
		wpcomsh_jetpack_wpcom_theme_delete( false, $stylesheet );
	}
}
add_action( 'delete_theme', 'wpcomsh_delete_managed_wpcom_theme' );

/**
 * Include the creation date in the themes API response.
 *
 * @param array $args The arguments.
 *
 * @return array The arguments with the creation time included.
 */
function wpcomsh_include_themes_creation_date( $args ) {
	$args['fields']['creation_time'] = true;

	return $args;
}
add_filter( 'install_themes_table_api_args_new', 'wpcomsh_include_themes_creation_date' );
add_filter( 'install_themes_table_api_args_search', 'wpcomsh_include_themes_creation_date' );
