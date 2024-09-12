<?php
/**
 * WPCom Whats New support for WordPress.com sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Check if the WPCom Whats New should be loaded.
 *
 * @return bool
 */
function should_load_wpcom_whats_new_app() {
	// Only load on the WPcom platform.
	if ( ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return false;
	}

	global $pagenow;
	$allowed_pages = array(
		'post.php',
		'post-new.php',
		'site-editor.php',
	);
	return isset( $pagenow ) && in_array( $pagenow, $allowed_pages, true );
}

/**
 * Enqueue block editor assets.
 */
function wpcom_whats_new_enqueue_script_and_style() {
	if ( ! should_load_wpcom_whats_new_app() ) {
		return;
	}

	$whats_new_handle = 'wpcom-whats-new';
	$version          = gmdate( 'Ymd' );

	$data = wp_json_encode(
		array(
			'siteId' => get_current_blog_id(),
		)
	);

	wp_enqueue_script(
		$whats_new_handle,
		'//widgets.wp.com/whats-new/build.min.js',
		array(
			'lodash',
			'react',
			'wp-api-fetch',
			'wp-components',
			'wp-compose',
			'wp-data',
			'wp-element',
			'wp-i18n',
			'wp-keycodes',
			'wp-plugins',
			'wp-polyfill',
		),
		$version,
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
	);

	wp_add_inline_script(
		$whats_new_handle,
		"var whatsNewAppConfig = $data;",
		'before'
	);

	wp_enqueue_style(
		$whats_new_handle,
		'//widgets.wp.com/whats-new/build.css',
		array( 'wp-components' ),
		$version
	);
}

add_action( 'enqueue_block_editor_assets', 'wpcom_whats_new_enqueue_script_and_style', 100 );

/**
 * Register the WPCOM Block Editor Whats New endpoints.
 */
function wpcom_whats_new_register_rest_api() {
	require_once __DIR__ . '/class-wp-rest-wpcom-block-editor-whats-new-dot-controller.php';
	$controller = new WP_REST_WPCOM_Block_Editor_Whats_New_Dot_Controller();
	$controller->register_rest_route();

	require_once __DIR__ . '/class-wp-rest-wpcom-block-editor-whats-new-list-controller.php';
	$controller = new WP_REST_WPCOM_Block_Editor_Whats_New_List_Controller();
	$controller->register_rest_route();
}
add_action( 'rest_api_init', 'wpcom_whats_new_register_rest_api' );
