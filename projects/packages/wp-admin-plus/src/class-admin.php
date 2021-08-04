<?php
/**
 * The WPAdminPlus Admin Area.
 *
 * @package automattic/jetpack-wp-admin-plus
 */

namespace Automattic\Jetpack\WPAdminPlus;

use Automattic\Jetpack\Assets;

/**
 * The WPAdminPlus Admin Area
 */
class Admin {

	/**
	 * Construction.
	 */
	public function __construct() {
		if ( ! did_action( 'jetpack_on_wp_admin_plus_init' ) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

			/**
			 * Action called after initializing WPAdminPlus Admin resources.
			 *
			 * @since 9.8.0
			 */
			do_action( 'jetpack_on_wp_admin_plus_init' );
			add_filter( 'query_vars', array( $this, 'add_query_vars' ) );
		}

	}

	/**
	 * Initialize the UI.
	 */
	public static function init() {
		new static();
	}

	/**
	 * Register wp-admin-plus query var.
	 *
	 * @param array $vars Current query vars.
	 */
	public function add_query_vars( $vars ) {
		$vars[] = 'wp-admin-plus';
		return $vars;
	}

	/**
	 * Enqueue scripts depending on the wp-admin-plus query var.
	 *
	 * @param string $hook Page hook.
	 */
	public function enqueue_scripts( $hook ) {
		$is_wp_admin_plus = get_query_var( 'wp-admin-plus' );
		$is_wp_admin_plus = isset( $is_wp_admin_plus ) && 'true' === $is_wp_admin_plus ? true : false;

		if ( $is_wp_admin_plus && 'edit.php' === $hook ) {
			$build_assets = require_once __DIR__ . '/../build/index.asset.php';

			$plugin_path = Assets::get_file_url_for_environment( '../build/index.js', '../build/index.js', __FILE__ );

			wp_enqueue_script(
				'jetpack_wpadminplus_ui_script',
				$plugin_path,
				$build_assets['dependencies'],
				$build_assets['version'],
				true
			);

			wp_enqueue_style(
				'jetpack_wpadminplus_ui_style',
				plugin_dir_url( __DIR__ ) . 'build/style-index.css',
				array( 'wp-components' ),
				$build_assets['version']
			);

			wp_style_add_data(
				'jetpack_wpadminplus_ui_style',
				'rtl',
				plugin_dir_url( __DIR__ ) . 'build/index.rtl.css'
			);
		}
	}
}
