<?php
/**
 * Tests for the Cache_Compatibility class.
 */

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Cache_Compatibility;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Class Cache_Compatibility_Test
 *
 * @covers \Automattic\Jetpack_Boost\Lib\Cache_Compatibility
 */
#[CoversClass( Cache_Compatibility::class )]
class Cache_Compatibility_Test extends Base_TestCase {
	/**
	 * Set up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Set up Brain Monkey
		Monkey\setUp();
	}

	/**
	 * Tear down the test.
	 */
	public function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test that the has_cache method returns true when the filter is used to override.
	 */
	public function test_has_cache_with_filter() {
		Functions\expect( 'apply_filters' )
			->once()
			->with( 'jetpack_boost_compatibility_has_cache', false )
			->andReturn( true );

		$this->assertTrue( Cache_Compatibility::has_cache() );
	}
}
