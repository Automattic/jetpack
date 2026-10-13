<?php
/**
 * Knowledge settings screen integration.
 *
 * @package automattic/jetpack-knowledge
 */

namespace Automattic\Jetpack\Knowledge;

use Automattic\Jetpack\Knowledge;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

/**
 * Loads the ported Gutenberg screen within wp-admin.
 */
class Settings {
	/**
	 * Register the settings page and its REST preload.
	 *
	 * @return void
	 */
	public static function init() {
		// Gutenberg registers generated pages even when their experiment is disabled.
		remove_action( 'admin_enqueue_scripts', 'gutenberg_guidelines_wp_admin_enqueue_scripts' );
		remove_action( 'guidelines-wp-admin_init', 'gutenberg_register_guidelines_wp_admin_page_routes' );
		remove_action( 'guidelines_init', 'gutenberg_register_guidelines_page_routes' );

		add_action( 'admin_menu', array( __CLASS__, 'load_assets' ), 1 );
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue' ), 5 );
	}

	/**
	 * Load generated page registration before WordPress registers the menu.
	 *
	 * @return void
	 */
	public static function load_assets() {
		$build = dirname( __DIR__ ) . '/build/build.php';
		if ( ! is_readable( $build ) ) {
			return;
		}

		require_once $build;
		if ( function_exists( 'jetpack_knowledge_register_script_modules' ) ) {
			jetpack_knowledge_register_script_modules();
		}
	}

	/**
	 * Preserve the upstream settings URL and menu labels.
	 *
	 * @return void
	 */
	public static function register_menu() {
		add_submenu_page(
			'options-general.php',
			__( 'Guidelines', 'jetpack-knowledge' ),
			__( 'Guidelines', 'jetpack-knowledge' ),
			'manage_options',
			'guidelines-wp-admin',
			array( __CLASS__, 'render' )
		);
	}

	/**
	 * Render the upstream generated wp-admin page.
	 *
	 * @return void
	 */
	public static function render() {
		if ( function_exists( 'jetpack_knowledge_guidelines_wp_admin_render_page' ) ) {
			jetpack_knowledge_guidelines_wp_admin_render_page();
		}
	}

	/**
	 * Enqueue the block registry and preload scopes on this screen only.
	 *
	 * @param string $hook_suffix Current admin page.
	 * @return void
	 */
	public static function enqueue( $hook_suffix ) {
		if ( 'settings_page_guidelines-wp-admin' !== $hook_suffix || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		WP_Build_Polyfills::register(
			'jetpack-knowledge',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
		);
		$dependencies = array( 'wp-block-library' );
		if ( wp_script_is( 'wp-jp-i18n-loader', 'registered' ) ) {
			$dependencies[] = 'wp-jp-i18n-loader';
		}
		foreach ( array( 'content', 'route' ) as $entry ) {
			$asset_file = dirname( __DIR__ ) . '/build/routes/guidelines/' . $entry . '.min.asset.php';
			if ( is_readable( $asset_file ) ) {
				$asset        = require $asset_file;
				$dependencies = array_merge( $dependencies, $asset['dependencies'] );
			}
		}
		wp_register_script( 'jetpack-knowledge-prerequisites', false, array_unique( $dependencies ), Knowledge::PACKAGE_VERSION, true );
		wp_enqueue_script( 'jetpack-knowledge-prerequisites' );

		$preload_paths = array(
			'/wp/v2/knowledge/guideline-scopes',
			array( '/wp/v2/knowledge/guideline-scopes', 'OPTIONS' ),
		);
		$preload_data  = array_reduce( $preload_paths, 'rest_preload_api_request', array() );
		wp_add_inline_script(
			'wp-api-fetch',
			sprintf( 'wp.apiFetch.use( wp.apiFetch.createPreloadingMiddleware( %s ) );', wp_json_encode( $preload_data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) ),
			'after'
		);
	}
}
