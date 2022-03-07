<?php
/**
 * CLI commands for Jetpack Boost.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Jetpack_Boost;

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

	const MAKE_E2E_TESTS_WORK_MODULES = array( 'critical-css', 'lazy-images', 'render-blocking-js' );

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
	 * wp jetpack-boost module activate critical-css
	 * wp jetpack-boost module deactivate critical-css
	 *
	 * @param array $args Command arguments.
	 */
	public function module( $args ) {
		$action = isset( $args[0] ) ? $args[0] : null;

		$module_slug = null;

		if ( isset( $args[1] ) ) {
			$module_slug = $args[1];
			if ( ! in_array( $module_slug, self::MAKE_E2E_TESTS_WORK_MODULES, true ) ) {
				\WP_CLI::error(
				/* translators: %s refers to the module slug like 'critical-css' */
					sprintf( __( "The '%s' module slug is invalid", 'jetpack-boost' ), $module_slug )
				);
			}
		} else {
			/* translators: Placeholder is list of available modules. */
			\WP_CLI::error( sprintf( __( 'Please specify a valid module. It should be one of %s', 'jetpack-boost' ), wp_json_encode( Jetpack_Boost::AVAILABLE_MODULES_DEFAULT ) ) );
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

	/**
	 * Set a module status.
	 *
	 * @param string $module_slug Module slug.
	 * @param string $status      Module status.
	 */
	private function set_module_status( $module_slug, $status ) {
		( new Status( $module_slug ) )->update( $status );
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
