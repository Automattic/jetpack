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
function wpcom_themes_api_get_service_instance(): WPCom_Themes_Service {
	static $instance;
	if ( ! $instance ) {
		// Load dependencies.
		require_once __DIR__ . '/includes/class-wpcom-themes-mapper.php';
		require_once __DIR__ . '/includes/class-wpcom-themes-merger.php';
		require_once __DIR__ . '/includes/class-wpcom-themes-cache.php';
		require_once __DIR__ . '/includes/class-wpcom-themes-service.php';
		require_once __DIR__ . '/includes/class-wpcom-themes-api.php';

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
 * Process the themes API result and add the recommended WPCom themes to the Popular tab.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass
 */
function wpcom_themes_api_popular_themes_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	$browse = $args->browse ?? '';
	if ( 'query_themes' !== $action || 'popular' !== $browse ) {
		return $res;
	}

	$wpcom_themes_service = wpcom_themes_api_get_service_instance();

	// Add results to the resulting array.
	return $wpcom_themes_service->filter_themes_api_result_recommended( $res );
}
add_filter( 'themes_api_result', 'wpcom_themes_api_popular_themes_result', 0, 3 );

/**
 * Process the themes API result and add the latest WPCom themes to the Latest tab.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass
 */
function wpcom_themes_api_latest_themes_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	$browse = $args->browse ?? '';
	if ( 'query_themes' !== $action || 'new' !== $browse ) {
		return $res;
	}

	$wpcom_themes_service = wpcom_themes_api_get_service_instance();

	// Add results to the resulting array.
	return $wpcom_themes_service->filter_themes_api_result_latest( $res );
}
add_filter( 'themes_api_result', 'wpcom_themes_api_latest_themes_result', 0, 3 );

/**
 * Process the themes API result and add the WPCom block themes to the Block themes tab.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass
 */
function wpcom_themes_api_block_themes_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	$tag = $args->tag ?? '';
	if ( 'query_themes' !== $action || 'full-site-editing' !== $tag ) {
		return $res;
	}

	$wpcom_themes_service = wpcom_themes_api_get_service_instance();

	// Add results to the resulting array.
	return $wpcom_themes_service->filter_themes_api_result_block_themes( $res );
}
add_filter( 'themes_api_result', 'wpcom_themes_api_block_themes_result', 0, 3 );

/**
 * Process the themes API result and add WPCom themes when using the search.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass
 */
function wpcom_themes_api_search_themes_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	$search = $args->search ?? '';
	if ( 'query_themes' !== $action || '' === $search ) {
		return $res;
	}

	$wpcom_themes_service = wpcom_themes_api_get_service_instance();

	// Add results to the resulting array.
	return $wpcom_themes_service->filter_themes_api_result_search( $res, $search );
}
add_filter( 'themes_api_result', 'wpcom_themes_api_search_themes_result', 0, 3 );

/**
 * Process the themes API result and add WPCom themes when using the filter feature.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass
 */
function wpcom_themes_api_feature_filter_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	$tags = $args->tag ?? array();
	if ( 'query_themes' !== $action || ! $tags ) {
		return $res;
	}

	if ( ! is_array( $tags ) ) {
		$tags = array( $tags );
	}

	$wpcom_themes_service = wpcom_themes_api_get_service_instance();

	// Add results to the resulting array.
	return $wpcom_themes_service->filter_themes_api_result_feature_filter( $res, $tags );
}
add_filter( 'themes_api_result', 'wpcom_themes_api_feature_filter_result', 0, 3 );

/**
 * Process the themes API result theme_information for WPCom themes if needed.
 *
 * @param mixed  $res    The result object.
 * @param string $action The action.
 * @param mixed  $args   The arguments.
 *
 * @return mixed|stdClass|WP_Error|null
 */
function wpcom_themes_api_theme_information_result( $res, string $action, $args ) {
	// Pre-requisites checks.
	if ( 'theme_information' !== $action ) {
		return $res;
	}

	$wpcom_themes_service = wpcom_themes_api_get_service_instance();

	return $wpcom_themes_service->get_theme( $args->slug ) ?? $res;
}
add_filter( 'themes_api_result', 'wpcom_themes_api_theme_information_result', 0, 3 );

/**
 * Include the creation date in the themes API response.
 *
 * @param array $args The arguments.
 *
 * @return array The arguments with the creation time included.
 */
function wpcom_themes_api_include_creation_date( $args ) {
	$args['fields']['creation_time'] = true;

	return $args;
}
add_filter( 'install_themes_table_api_args_new', 'wpcom_themes_api_include_creation_date' );
add_filter( 'install_themes_table_api_args_search', 'wpcom_themes_api_include_creation_date' );
