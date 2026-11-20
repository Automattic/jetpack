<?php
/**
 * Tests for how the Jetpack plugin honors jetpack_feature_policy.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Feature_Policy;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests the default-module states a host sets through `jetpack_feature_policy`.
 *
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_Feature_Policy_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The feature policy a test registered, kept so tear_down can unhook it.
	 *
	 * @var callable|null
	 */
	private $feature_policy = null;

	/**
	 * Tear down.
	 */
	public function tear_down() {
		if ( $this->feature_policy !== null ) {
			remove_filter( 'jetpack_feature_policy', $this->feature_policy );
			$this->feature_policy = null;
		}
		Feature_Policy::reset();

		parent::tear_down();
	}

	/**
	 * Registers a feature policy for the duration of the test.
	 *
	 * @param array $policy Map of slug to policy.
	 */
	private function set_feature_policy( array $policy ) {
		$this->feature_policy = function () use ( $policy ) {
			return $policy;
		};
		add_filter( 'jetpack_feature_policy', $this->feature_policy );
	}

	/**
	 * Tests that jetpack_feature_policy's default states change the default modules.
	 */
	public function test_get_default_modules_honors_feature_policy() {
		$this->assertNotContains( 'carousel', Jetpack::get_default_modules() );
		$this->assertContains( 'blocks', Jetpack::get_default_modules() );

		$this->set_feature_policy(
			array(
				'carousel' => array( 'activation' => 'default-on' ),
				'blocks'   => array( 'activation' => 'default-off' ),
			)
		);
		$defaults = Jetpack::get_default_modules();

		$this->assertContains( 'carousel', $defaults );
		$this->assertNotContains( 'blocks', $defaults );
	}

	/**
	 * Tests that default activation never saves a forced-off module as active.
	 */
	public function test_activate_default_modules_skips_forced_off_modules() {
		$this->set_feature_policy( array( 'blocks' => array( 'activation' => 'forced-off' ) ) );

		Jetpack::activate_default_modules( false, false, array(), false, false, null, null );

		$this->assertNotContains( 'blocks', (array) get_option( 'jetpack_active_modules', array() ) );
	}
}
