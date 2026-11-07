<?php

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;

/**
 * Test A8c_Mc_Stats class
 */
class StatsTest extends TestCase {

	/**
	 * Test add and get_current_status methods
	 */
	public function test_add_get() {

		$stats = new A8c_Mc_Stats();

		$stats->add( 'group', 'test' );

		$check = $stats->get_current_stats();

		$this->assertCount( 1, $check );
		$this->assertArrayHasKey( 'group', $check );
		$this->assertContains( 'test', $check['group'] );
		$this->assertCount( 1, $check['group'] );

		$stats->add( 'group', 'test2' );

		$check = $stats->get_current_stats();

		$this->assertCount( 1, $check );
		$this->assertArrayHasKey( 'group', $check );
		$this->assertContains( 'test', $check['group'] );
		$this->assertContains( 'test2', $check['group'] );
		$this->assertCount( 2, $check['group'] );

		$stats->add( 'group2', 'test3' );

		$check = $stats->get_current_stats();

		$this->assertCount( 2, $check );
		$this->assertArrayHasKey( 'group', $check );
		$this->assertArrayHasKey( 'group2', $check );
		$this->assertContains( 'test', $check['group'] );
		$this->assertContains( 'test2', $check['group'] );
		$this->assertContains( 'test3', $check['group2'] );
		$this->assertCount( 2, $check['group'] );
		$this->assertCount( 1, $check['group2'] );

		// test errors.

		$this->assertFalse( $stats->add( 'group2', 'test3' ) );
		$this->assertFalse( $stats->add( true, 'test3' ) );
		$this->assertFalse( $stats->add( array( 123 ), 'test3' ) );
	}

	/**
	 * Test get group query args
	 */
	public function test_get_group_query_args() {

		$stats = new A8c_Mc_Stats();
		$stats->add( 'group', 'test' );
		$stats->add( 'group', 'test2' );

		$this->assertEmpty( $stats->get_group_query_args( 'group2' ) );

		$check = $stats->get_group_query_args( 'group' );

		$this->assertCount( 1, $check );
		$this->assertArrayHasKey( 'x_jetpack-group', $check );
		$this->assertEquals( 'test,test2', $check['x_jetpack-group'] );
	}

	/**
	 * Test that do_server_side_stats sends every group without waiting, then clears the stats.
	 */
	public function test_do_server_side_stats_does_not_block() {
		$stats = new class() extends A8c_Mc_Stats {
			public $calls = array();

			public function get_stats_urls() {
				return array( 'https://example.com/a', 'https://example.com/b' );
			}

			public function do_server_side_stat( $url, $blocking = true ) {
				$this->calls[] = array( $url, $blocking );
				return true;
			}
		};
		$stats->add( 'group', 'test' );

		$stats->do_server_side_stats();

		$this->assertSame(
			array( array( 'https://example.com/a', false ), array( 'https://example.com/b', false ) ),
			$stats->calls
		);
		$this->assertEmpty( $stats->get_current_stats() );
	}
}
