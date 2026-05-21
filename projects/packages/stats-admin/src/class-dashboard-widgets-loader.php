<?php
/**
 * Experimental dashboard widgets loader for Jetpack Stats.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use WP_Widget_Type_Registry;

/**
 * Bridges wp-build widget artifacts with Gutenberg's experimental dashboard.
 */
class Dashboard_Widgets_Loader {

	/**
	 * Whether hooks were registered.
	 *
	 * @var bool
	 */
	private static $bootstrapped = false;

	/**
	 * Wire the loader into WordPress.
	 */
	public static function init() {
		$build_file = dirname( __DIR__ ) . '/build/build.php';
		if ( file_exists( $build_file ) ) {
			require_once $build_file;
		}

		add_action( 'init', array( __CLASS__, 'maybe_bootstrap' ), 1 );
	}

	/**
	 * Conditionally bootstraps dashboard widgets when the experimental infra is present.
	 */
	public static function maybe_bootstrap() {
		if ( self::$bootstrapped ) {
			return;
		}

		if ( ! self::is_enabled() ) {
			return;
		}

		if ( ! function_exists( 'jetpack_stats_admin_get_registered_widget_modules' ) ) {
			return;
		}

		self::$bootstrapped = true;

		add_action( 'init', array( __CLASS__, 'register_widget_types' ), 11 );
		add_filter( 'dashboard-wp-admin_boot_dependencies', array( __CLASS__, 'add_widget_modules_to_boot_deps' ) );
	}

	/**
	 * Whether Jetpack Stats dashboard widgets should load.
	 *
	 * @return bool
	 */
	private static function is_enabled() {
		/**
		 * Enable Jetpack Stats widgets on the experimental wp-admin dashboard.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Whether widgets are enabled.
		 */
		if ( ! apply_filters( 'jetpack_stats_experimental_dashboard_widgets_enabled', true ) ) {
			return false;
		}

		if ( ! current_user_can( 'view_stats' ) && ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		$connection = new Connection_Manager( 'jetpack' );
		if ( ! $connection->is_connected() ) {
			return false;
		}

		$modules = new Modules();
		if ( ! $modules->is_active( 'stats' ) || ! $modules->is_active( 'subscriptions' ) ) {
			return false;
		}

		return class_exists( WP_Widget_Type_Registry::class );
	}

	/**
	 * Registers Jetpack Stats widgets in the shared widget type registry.
	 */
	public static function register_widget_types() {
		if ( ! class_exists( WP_Widget_Type_Registry::class ) ) {
			return;
		}

		if ( ! function_exists( 'jetpack_stats_admin_get_registered_widget_modules' ) ) {
			return;
		}

		$registry = WP_Widget_Type_Registry::get_instance();

		foreach ( jetpack_stats_admin_get_registered_widget_modules() as $widget ) {
			if ( ! is_array( $widget ) || empty( $widget['name'] ) || $registry->is_registered( $widget['name'] ) ) {
				continue;
			}

			$registry->register(
				$widget['name'],
				array(
					'render_module' => $widget['render_module'] ?? null,
					'widget_module' => $widget['widget_module'] ?? null,
					'presentation'  => $widget['presentation'] ?? null,
				)
			);
		}
	}

	/**
	 * Adds Jetpack Stats widget modules to the dashboard page boot dependencies.
	 *
	 * @param array $boot_dependencies Boot dependencies for the dashboard page.
	 * @return array
	 */
	public static function add_widget_modules_to_boot_deps( array $boot_dependencies ) {
		if ( ! function_exists( 'jetpack_stats_admin_get_registered_widget_modules' ) ) {
			return $boot_dependencies;
		}

		foreach ( jetpack_stats_admin_get_registered_widget_modules() as $widget ) {
			if ( ! is_array( $widget ) ) {
				continue;
			}

			if ( ! empty( $widget['render_module'] ) ) {
				$boot_dependencies[] = array(
					'import' => 'dynamic',
					'id'     => $widget['render_module'],
				);
			}

			if ( ! empty( $widget['widget_module'] ) ) {
				$boot_dependencies[] = array(
					'import' => 'dynamic',
					'id'     => $widget['widget_module'],
				);
			}
		}

		return $boot_dependencies;
	}
}
