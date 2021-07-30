<?php
/**
 * CLI commands for Jetpack Boost.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class CLI
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
	 */
	public function reset_settings() {
		$this->jetpack_boost->config()->reset();
		\WP_CLI::success( 'Reset settings successfully' );
	}

	/**
	 * Register CLI commands.
	 *
	 * @param \Automattic\Jetpack_Boost\Jetpack_Boost $jetpack_boost Jetpack Boost plugin.
	 */
	public static function register( $jetpack_boost ) {
		$instance = new CLI( $jetpack_boost );
		\WP_CLI::add_command( 'jetpack-boost reset-settings', array( $instance, 'reset_settings' ) );
	}
}
