<?php
/**
 * Tests for Classic_Stats.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Classic_Stats
 */
#[CoversClass( Classic_Stats::class )]
class Classic_Stats_Test extends BaseTestCase {

	/**
	 * Forget the registered flag between tests.
	 */
	public function tear_down() {
		Feature_Flags::reset();

		parent::tear_down();
	}

	public function test_classic_page_is_retired_once_a_plugin_registers_the_flag() {
		Classic_Stats::register_feature_flag();

		$this->assertTrue( Classic_Stats::is_retired() );
	}
}
