<?php
/**
 * Tests for playback entitlement checks alongside older Jetpack services.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;

/**
 * Isolate the paywall factory from the shared helper loaded by other suites.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[\PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses]
#[\PHPUnit\Framework\Attributes\PreserveGlobalState( false )]
class Block_Level_Access_Compatibility_Test extends BaseTestCase {

	/**
	 * Install a factory without the newer shared block helper.
	 */
	protected function set_up() {
		parent::set_up();
		require_once __DIR__ . '/mocks/compatibility-premium-content-subscription-service.php';
		$this->assertFalse( function_exists( '\Automattic\Jetpack\Extensions\Premium_Content\visitor_has_subscription_access_to_plan_ids' ) );
	}

	public function test_old_service_without_entitlement_check_denies_playback() {
		$service                               = new class() {
			/** @var bool Whether the editorial API was called. */
			public $called = false;

			/** @return bool An editorial access grant. */
			public function visitor_can_view_content() {
				$this->called = true;
				return true;
			}
		};
		$GLOBALS['__vp_compatibility_service'] = $service;

		$this->assertFalse( $this->check_block_gate() );
		$this->assertFalse( $service->called );
	}

	public function test_entitlement_service_works_without_new_shared_helper() {
		$service                               = new class() {
			/** @var array The entitlement check arguments. */
			public $received = array();

			/**
			 * @param array  $plan_ids Required subscription plans.
			 * @param string $access_level Content access level.
			 * @param int    $post_id Embedding post ID.
			 * @return bool Whether the visitor holds the required plan.
			 */
			public function visitor_has_subscription_access( $plan_ids, $access_level, $post_id ) {
				$this->received = array( $plan_ids, $post_id );
				return true;
			}
		};
		$GLOBALS['__vp_compatibility_service'] = $service;

		$this->assertTrue( $this->check_block_gate() );
		$this->assertSame( array( array( 222 ), 123 ), $service->received );
	}

	/**
	 * Invoke the compatibility boundary directly.
	 *
	 * @return bool Playback entitlement.
	 */
	private function check_block_gate() {
		$method = new \ReflectionMethod( Access_Control::class, 'block_gate_grants_access' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( Access_Control::instance(), array( 222 ), 123 );
	}
}
