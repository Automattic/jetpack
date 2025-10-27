<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use ReflectionProperty;

/**
 * Unit tests for the Dashbaord class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Dashboard_Test extends Stats_TestCase {
	/**
	 * Test that init sets $initialized.
	 */
	public function test_init_sets_initialized() {
		Dashboard::init();

		$rp = new ReflectionProperty( Dashboard::class, 'initialized' );
		\Automattic\Jetpack\Test_Environment::maybe_set_reflectionproperty_or_reflectionmethod_as_accessible( $rp );
		$this->assertTrue( $rp->getValue() );
	}

	/**
	 * Test has root dom.
	 */
	public function test_render() {
		$this->expectOutputRegex( '/<div id="wpcom" class="jp-stats-dashboard".*>/i' );
		( new Dashboard() )->render();
	}
}
