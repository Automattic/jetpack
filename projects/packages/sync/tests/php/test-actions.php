<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Actions class.
 *
 * @package automattic/jetpack-sync
 */
class Test_Actions extends TestCase {

	/**
	 * Tests the should_do_initial_sync method.
	 *
	 * @param bool  $doing_registered_action Whether the 'jetpack_site_registered' action is currently in progress.
	 * @param mixed $started                 The 'jetpack_sync_full_status' option's 'started' field value.
	 * @param mixed $finished                The 'jetpack_sync_full_status' option's 'finished' field value.
	 * @param bool  $expected_result        The value that Actions::should_do_initial_sync is expected to return.
	 *
	 * @dataProvider data_provider_test_should_do_initial_sync
	 */
	public function test_should_do_intitial_sync( $doing_registered_action, $started, $finished, $expected_result ) {
		Constants::set_constant( 'JETPACK_DISABLE_RAW_OPTIONS', true );
		$full_sync_option = array(
			'started'  => $started,
			'finished' => $finished,
			'progress' => array(),
			'config'   => array(),
		);

		\Jetpack_Options::update_raw_option( Modules\Full_Sync_Immediately::STATUS_OPTION, $full_sync_option );

		global $wp_current_filter;
		$original_filter = $wp_current_filter;
		if ( $doing_registered_action ) {
			$wp_current_filter = array( 'jetpack_site_registered' ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}

		$result = Actions::should_do_initial_sync();

		delete_option( Modules\Full_Sync_Immediately::STATUS_OPTION );
		$wp_current_filter = $original_filter; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		$this->assertSame( $expected_result, $result );
	}

	/**
	 * Data provider for the test_should_do_initial_sync method.
	 *
	 * @return array The test data with the format:
	 *   [
	 *     'do_registered_action" => (bool) Whether the 'jetpack_site_registered' action is currently in progress.
	 *     'started'              => (mixed) The 'jetpack_sync_full_status' option's 'started' field value.
	 *     'finished'             => (mixed) The 'jetpack_sync_full_status' option's 'finished' field value.
	 *     'expected_result'      => (bool) The value that Actions::should_do_initial_sync is expected to return.
	 *   ]
	 */
	public function data_provider_test_should_do_initial_sync() {
		return array(
			'registering, full sync started'         => array(
				'do_registered_action' => true,
				'started'              => time(),
				'finished'             => false,
				'expected_result'      => false,
			),
			'registering, full sync finished'        => array(
				'do_registered_action' => true,
				'started'              => time(),
				'finished'             => time(),
				'expected_result'      => true,
			),
			'registering, full sync not started'     => array(
				'do_registered_action' => true,
				'started'              => false,
				'finished'             => false,
				'expected_result'      => true,
			),
			'not registering, full sync started'     => array(
				'do_registered_action' => false,
				'started'              => time(),
				'finished'             => time(),
				'expected_result'      => false,
			),
			'not registering, full sync not started' => array(
				'do_registered_action' => false,
				'started'              => false,
				'finished'             => false,
				'expected_result'      => true,
			),
		);
	}
}
