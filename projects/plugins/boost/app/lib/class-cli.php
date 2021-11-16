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

	/**
	 * CLI constructor.
	 *
	 * @param \Automattic\Jetpack_Boost\Jetpack_Boost $jetpack_boost Jetpack Boost plugin.
	 */
	public function __construct( $jetpack_boost ) {
		$this->jetpack_boost = $jetpack_boost;
	}

	/**
	 * Reset settings command.
	 *
	 * @subcommand reset-settings
	 */
	public function reset_settings() {
		$this->jetpack_boost->config()->reset();
		\WP_CLI::success( 'Reset settings successfully' );
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
	 * wp jetpack module activate critical-css
	 * wp jetpack module deactivate critical-css
	 *
	 * @param array $args Command arguments.
	 */
	public function module( $args ) {
		$action = isset( $args[0] ) ? $args[0] : null;

		if ( ! $action ) {
			\WP_CLI::error( __( 'Please specify a valid action.', 'jetpack-boost' ) );
		}

		$module_slug = null;

		if ( isset( $args[1] ) ) {
			$module_slug = $args[1];
			if ( ! in_array( $module_slug, Jetpack_Boost::AVAILABLE_MODULES_DEFAULT, true ) ) {
				\WP_CLI::error(
					/* translators: %s refers to the module slug like 'critical-css' */
					sprintf( __( "The '%s' module slug is invalid", 'jetpack-boost' ), $module_slug )
				);
			}
		} else {
			\WP_CLI::error( __( 'Please specify a valid module.', 'jetpack-boost' ) );
		}

		switch ( $action ) {
			case 'activate':
				$this->set_module_status( $module_slug, 'active' );
				break;
			case 'deactivate':
				$this->set_module_status( $module_slug, 'inactive' );
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
		$enable = 'active' === $status;

		$this->jetpack_boost->set_module_status( $enable, $module_slug );
		$status_label = $enable ? __( 'activated', 'jetpack-boost' ) : __( 'deactivated', 'jetpack-boost' );

		/* translators: The %1$s refers to the module slug, %2$s refers to the module state (either activated or deactivated)*/
		\WP_CLI::success(
			sprintf( __( "'%1\$s' has been %2\$s.", 'jetpack-boost' ), $module_slug, $status_label )
		);
	}
}
