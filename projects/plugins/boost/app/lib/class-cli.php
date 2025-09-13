<?php
/**
 * CLI commands for Jetpack Boost.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Data_Sync\Getting_Started_Entry;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Garbage_Collection;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Settings;

/**
 * Control your local Jetpack Boost installation.
 */
class CLI {

	/**
	 * Jetpack Boost plugin.
	 *
	 * @var \Automattic\Jetpack_Boost\Jetpack_Boost $jetpack_boost
	 */
	private $jetpack_boost;

	const MAKE_E2E_TESTS_WORK_MODULES = array( 'critical_css', 'speculation_rules', 'render_blocking_js', 'page_cache', 'lcp', 'minify_js', 'minify_css', 'image_cdn', 'image_guide' );

	/**
	 * CLI constructor.
	 *
	 * @param \Automattic\Jetpack_Boost\Jetpack_Boost $jetpack_boost Jetpack Boost plugin.
	 */
	public function __construct( $jetpack_boost ) {
		$this->jetpack_boost = $jetpack_boost;
	}

	/**
	 * Manage Jetpack Boost Modules
	 *
	 * ## OPTIONS
	 *
	 * <activate|deactivate>
	 * : The action to take.
	 * ---
	 * options:
	 *  - activate
	 *  - deactivate
	 * ---
	 *
	 * [<module_slug>]
	 * : The slug of the module to perform an action on.
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack-boost module activate critical_css
	 * wp jetpack-boost module deactivate critical_css
	 *
	 * @param array $args Command arguments.
	 */
	public function module( $args ) {
		$action      = isset( $args[0] ) ? $args[0] : null;
		$module_slug = isset( $args[1] ) ? $args[1] : null;

		if ( $module_slug === null ) {
			/* translators: Placeholder is list of available modules. */
			\WP_CLI::error( sprintf( __( 'Please specify a valid module. It should be one of %s', 'jetpack-boost' ), wp_json_encode( self::MAKE_E2E_TESTS_WORK_MODULES ) ) );
		}

		if ( ! in_array( $module_slug, self::MAKE_E2E_TESTS_WORK_MODULES, true ) ) {
			\WP_CLI::error(
				/* translators: %1$s refers to the module slug like 'critical-css', %2$s is the list of available modules. */
				sprintf( __( "The '%1\$s' module slug is invalid. It should be one of %2\$s", 'jetpack-boost' ), $module_slug, wp_json_encode( self::MAKE_E2E_TESTS_WORK_MODULES ) )
			);
		}

		switch ( $action ) {
			case 'activate':
				$this->set_module_status( $module_slug, true );
				break;
			case 'deactivate':
				$this->set_module_status( $module_slug, false );
				break;
		}
	}

	public function getting_started( $args ) {
		$status = isset( $args[0] ) ? $args[0] : null;

		if ( ! in_array( $status, array( 'true', 'false' ), true ) ) {
			\WP_CLI::error(
				/* translators: %s refers to the module slug like 'critical-css' */
				sprintf( __( "The '%s' status is invalid", 'jetpack-boost' ), $status )
			);
		}

		( new Getting_Started_Entry() )->set( 'true' === $status );

		\WP_CLI::success(
			/* translators: %s refers to 'true' or 'false' */
			sprintf( __( 'Getting started is set to %s', 'jetpack-boost' ), $status )
		);
	}

	/**
	 * Set a module status.
	 *
	 * @param string $module_slug Module slug.
	 * @param string $status      Module status.
	 */
	private function set_module_status( $module_slug, $status ) {
		$modules = ( new Modules_Setup() )->get_available_modules_and_submodules();
		$module  = $modules[ $module_slug ] ?? false;
		if ( ! ( $module instanceof Module ) ) {
			\WP_CLI::error(
				/* translators: %s refers to the module slug like 'critical-css' */
				sprintf( __( "The '%s' module slug is invalid", 'jetpack-boost' ), $module_slug )
			);
		}

		$module->update( $status );

		if ( $module_slug === 'page_cache' && $status ) {
			$setup_result = Page_Cache_Setup::run_setup();
			if ( is_wp_error( $setup_result ) ) {
				\WP_CLI::error(
					sprintf(
						/* translators: %s refers to the error code */
						__( 'Setup: %s', 'jetpack-boost' ),
						$setup_result->get_error_code()
					)
				);
			}

			Garbage_Collection::activate();
			Boost_Cache_Settings::get_instance()->set( array( 'enabled' => true ) );
		}

		$status_label = $status ? __( 'activated', 'jetpack-boost' ) : __( 'deactivated', 'jetpack-boost' );

		/* translators: The %1$s refers to the module slug, %2$s refers to the module state (either activated or deactivated)*/
		\WP_CLI::success(
			sprintf( __( "'%1\$s' has been %2\$s.", 'jetpack-boost' ), $module_slug, $status_label )
		);
	}

	/**
	 * Manage Jetpack Boost connection
	 *
	 * ## OPTIONS
	 *
	 * <activate|deactivate|status>
	 * : The action to take.
	 * ---
	 * options:
	 *  - activate
	 *  - deactivate
	 *  - status
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack-boost connection activate
	 * wp jetpack-boost connection deactivate
	 * wp jetpack-boost connection status
	 *
	 * @param array $args Command arguments.
	 */
	public function connection( $args ) {
		$action = isset( $args[0] ) ? $args[0] : null;

		switch ( $action ) {
			case 'activate':
				$result = $this->jetpack_boost->connection->register();
				if ( true === $result ) {
					\WP_CLI::success( __( 'Boost is connected to WP.com', 'jetpack-boost' ) );
				} else {
					\WP_CLI::error( __( 'Boost could not be connected to WP.com', 'jetpack-boost' ) );
				}
				break;
			case 'deactivate':
				require_once ABSPATH . '/wp-admin/includes/plugin.php';

				if ( is_plugin_active_for_network( JETPACK_BOOST_PATH ) ) {
					$this->jetpack_boost->connection->deactivate_disconnect_network();
				} else {
					$this->jetpack_boost->connection->disconnect();
				}

				\WP_CLI::success( __( 'Boost is disconnected from WP.com', 'jetpack-boost' ) );
				break;
			case 'status':
				$is_connected = $this->jetpack_boost->connection->is_connected();
				if ( $is_connected ) {
					\WP_CLI::line( 'connected' );
				} else {
					\WP_CLI::line( 'disconnected' );
				}
				break;
		}
	}

	/**
	 * Reset Jetpack Boost
	 *
	 * ## EXAMPLE
	 *
	 * wp jetpack-boost reset
	 */
	public function reset() {
		$this->jetpack_boost->deactivate();
		$this->jetpack_boost->uninstall();
		\WP_CLI::success( 'Reset successfully' );
	}
}
