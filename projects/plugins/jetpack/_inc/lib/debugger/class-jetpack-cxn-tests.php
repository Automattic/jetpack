<?php
/**
 * Jetpack-specific connection tests.
 *
 * Extends the connection package's Connection_Health_Test_Base with Jetpack-specific
 * tests (sync health) and Jetpack-specific helper overrides.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Connection_Health_Test_Base;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Sync\Health as Sync_Health;
use Automattic\Jetpack\Sync\Settings as Sync_Settings;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_Cxn_Tests contains the Jetpack-specific connection tests.
 *
 * Extends the connection package's framework and provides Jetpack-specific
 * tests (sync health), encryption, and Jetpack-specific helper overrides.
 *
 * Jetpack-specific tests are also registered with the connection package's
 * Site Health integration via the jetpack_connection_tests_loaded action.
 */
class Jetpack_Cxn_Tests extends Connection_Health_Test_Base {

	/**
	 * Register Jetpack-specific tests on an external test suite instance.
	 *
	 * Used to add Jetpack tests to the connection package's Site Health integration
	 * via the jetpack_connection_tests_loaded action.
	 *
	 * @param Connection_Health_Test_Base $target The test suite to register tests on.
	 */
	public function register_tests_on( $target ) {
		$methods = get_class_methods( static::class );
		foreach ( $methods as $method ) {
			if ( ! str_contains( $method, 'test__' ) ) {
				continue;
			}
			$target->add_test( array( $this, $method ), $method, 'direct' );
		}
	}

	/**
	 * Sync Health Tests.
	 *
	 * @return array Test results.
	 */
	protected function test__sync_health() {
		$name = 'test__sync_health';

		if ( ! $this->helper_is_connected() ) {
			return self::skipped_test(
				array(
					'name'                => $name,
					'show_in_site_health' => false,
				)
			);
		}

		if ( ! Sync_Settings::is_sync_enabled() ) {
			return self::failing_test(
				array(
					'name'              => $name,
					'label'             => __( 'Jetpack Sync has been disabled on your site.', 'jetpack' ),
					'severity'          => 'recommended',
					'action'            => 'https://github.com/Automattic/jetpack/blob/trunk/projects/packages/sync/src/class-settings.php',
					'action_label'      => __( 'See GitHub for more on Sync Settings', 'jetpack' ),
					'short_description' => __( 'Jetpack Sync has been disabled on your site. This could be impacting some of your site\'s Jetpack-powered features. Developers may enable / disable syncing using the Sync Settings API.', 'jetpack' ),
				)
			);
		}

		if ( Sync_Health::get_status() === Sync_Health::STATUS_OUT_OF_SYNC ) {
			return self::failing_test(
				array(
					'name'              => $name,
					'label'             => __( 'Jetpack has detected a problem with the communication between your site and WordPress.com', 'jetpack' ),
					'severity'          => 'critical',
					'action'            => Redirect::get_url( 'jetpack-contact-support' ),
					'action_label'      => __( 'Contact Jetpack Support', 'jetpack' ),
					'short_description' => __( 'There is a problem with the communication between your site and WordPress.com. This could be impacting some of your site\'s Jetpack-powered features. If you continue to see this error, please contact support for assistance.', 'jetpack' ),
				)
			);
		}

		return self::passing_test( array( 'name' => $name ) );
	}
}
