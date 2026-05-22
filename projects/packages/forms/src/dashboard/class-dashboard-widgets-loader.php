<?php
/**
 * Experimental dashboard widgets loader for Jetpack Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

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
	 * Whether Jetpack experimental dashboard widgets should load for this request.
	 *
	 * @return bool
	 */
	public static function are_enabled() {
		/**
		 * Enable Jetpack widgets on the experimental wp-admin dashboard.
		 *
		 * When false, widget build artifacts are not loaded and widget types are not registered.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Whether experimental dashboard widgets are enabled.
		 */
		return (bool) apply_filters( 'jetpack_experimental_dashboard_widgets_enabled', false );
	}

	/**
	 * Wire the loader into WordPress.
	 */
	public static function init() {
		if ( ! self::are_enabled() ) {
			return;
		}

		$build_file = dirname( __DIR__, 2 ) . '/build/build.php';
		if ( file_exists( $build_file ) ) {
			require_once $build_file;
		}

		// Priority 20: after Contact_Form_Plugin::init (9) registers the feedback post type.
		add_action( 'init', array( __CLASS__, 'maybe_bootstrap' ), 20 );
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

		if ( ! function_exists( 'jetpack_forms_get_registered_widget_modules' ) ) {
			return;
		}

		self::$bootstrapped = true;

		self::register_widget_types();
		add_filter( 'dashboard-wp-admin_boot_dependencies', array( __CLASS__, 'add_widget_modules_to_boot_deps' ) );
	}

	/**
	 * Whether Jetpack Forms dashboard widgets should load.
	 *
	 * @return bool
	 */
	private static function is_enabled() {
		return class_exists( WP_Widget_Type_Registry::class );
	}

	/**
	 * Whether the current user can manage form responses (required to show widgets).
	 *
	 * @return bool
	 */
	private static function current_user_can_manage_responses() {
		$feedback_post_type = get_post_type_object( 'feedback' );
		if ( ! $feedback_post_type ) {
			return false;
		}

		return current_user_can( $feedback_post_type->cap->edit_posts );
	}

	/**
	 * Registers Jetpack Forms widgets in the shared widget type registry.
	 */
	public static function register_widget_types() {
		if ( ! self::current_user_can_manage_responses() ) {
			return;
		}

		if ( ! class_exists( WP_Widget_Type_Registry::class ) ) {
			return;
		}

		if ( ! function_exists( 'jetpack_forms_get_registered_widget_modules' ) ) {
			return;
		}

		$registry = WP_Widget_Type_Registry::get_instance();

		foreach ( jetpack_forms_get_registered_widget_modules() as $widget ) {
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
	 * Adds Jetpack Forms widget modules to the dashboard page boot dependencies.
	 *
	 * @param array $boot_dependencies Boot dependencies for the dashboard page.
	 * @return array
	 */
	public static function add_widget_modules_to_boot_deps( array $boot_dependencies ) {
		if ( ! function_exists( 'jetpack_forms_get_registered_widget_modules' ) ) {
			return $boot_dependencies;
		}

		foreach ( jetpack_forms_get_registered_widget_modules() as $widget ) {
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
