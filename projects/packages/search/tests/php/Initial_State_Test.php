<?php
/**
 * Tests for the dashboard Initial_State class.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Search\Initial_State
 */
#[CoversClass( Initial_State::class )]
class Initial_State_Test extends Search_TestCase {

	/**
	 * Tear down filters between tests so cross-pollution can't hide a regression.
	 */
	public function tearDown(): void {
		remove_all_filters( 'jetpack_search_blocks_enabled' );
		parent::tearDown();
	}

	/**
	 * The flag must default to false when no filter is registered.
	 */
	public function test_search_blocks_enabled_defaults_false() {
		$state = ( new Initial_State() )->get_initial_state();
		$this->assertArrayHasKey( 'searchBlocksEnabled', $state['siteData'] );
		$this->assertFalse( $state['siteData']['searchBlocksEnabled'] );
	}

	/**
	 * The flag must be true when the filter returns true.
	 */
	public function test_search_blocks_enabled_reflects_filter() {
		add_filter( 'jetpack_search_blocks_enabled', '__return_true' );
		$state = ( new Initial_State() )->get_initial_state();
		$this->assertTrue( $state['siteData']['searchBlocksEnabled'] );
	}
}
