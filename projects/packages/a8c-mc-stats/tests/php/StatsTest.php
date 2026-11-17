<?php

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;

/**
 * Test A8c_Mc_Stats class
 */
class StatsTest extends TestCase {

	/**
	 * HTTP requests captured by the `pre_http_request` filter, as `[ url, args ]` pairs.
	 *
	 * @var array[]
	 */
	private $requests = array();

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
	 * Test that do_server_side_stats sends every group without waiting, through do_server_side_stat overrides, then clears the stats.
	 */
	public function test_do_server_side_stats_does_not_block() {
		$stats = new class() extends A8c_Mc_Stats {
			public $calls = array();

			public function get_stats_urls() {
				return array( 'https://example.com/a', 'https://example.com/b' );
			}

			/**
			 * The pre-existing signature, as overridden by WooCommerce's McStats.
			 *
			 * @param string $url The URL.
			 */
			public function do_server_side_stat( $url ) {
				$this->calls[] = $url;
				return parent::do_server_side_stat( $url );
			}
		};
		$stats->add( 'group', 'test' );

		$filter = function ( $pre, $args, $url ) {
			$this->requests[] = array( $url, $args );
			return array( 'response' => array( 'code' => false ) );
		};
		add_filter( 'pre_http_request', $filter, 10, 3 );
		try {
			$stats->do_server_side_stats();
		} finally {
			remove_filter( 'pre_http_request', $filter, 10 );
		}

		$this->assertSame( array( 'https://example.com/a', 'https://example.com/b' ), $stats->calls );
		$this->assertSame( array( false, false ), array_column( array_column( $this->requests, 1 ), 'blocking' ) );
		$this->assertEmpty( $stats->get_current_stats() );
	}

	/**
	 * Test that do_server_side_stat and do_server_side_stat_without_waiting send the right request args and interpret the response.
	 *
	 * @dataProvider provide_do_server_side_stat
	 *
	 * @param bool            $blocking Whether the request blocks.
	 * @param array|\WP_Error $response Response returned by the `pre_http_request` filter.
	 * @param bool            $expected Expected return value.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_do_server_side_stat' )]
	public function test_do_server_side_stat( $blocking, $response, $expected ) {
		$filter = function ( $pre, $args, $url ) use ( $response ) {
			$this->requests[] = array( $url, $args );
			return $response;
		};
		add_filter( 'pre_http_request', $filter, 10, 3 );

		try {
			$stats  = new A8c_Mc_Stats();
			$url    = 'https://example.com/g.gif?x_jetpack-group=test';
			$result = $blocking ? $stats->do_server_side_stat( $url ) : $stats->do_server_side_stat_without_waiting( $url );
		} finally {
			remove_filter( 'pre_http_request', $filter, 10 );
		}

		$this->assertSame( $expected, $result );
		$this->assertCount( 1, $this->requests );
		$this->assertSame( 'https://example.com/g.gif?x_jetpack-group=test', $this->requests[0][0] );
		if ( $blocking ) {
			$this->assertTrue( $this->requests[0][1]['blocking'] );
			$this->assertNotSame( 1, $this->requests[0][1]['timeout'] );
		} else {
			$this->assertFalse( $this->requests[0][1]['blocking'] );
			$this->assertSame( 1, $this->requests[0][1]['timeout'] );
		}
	}

	/**
	 * Data provider for test_do_server_side_stat.
	 *
	 * @return array
	 */
	public static function provide_do_server_side_stat() {
		$ok        = array( 'response' => array( 'code' => 200 ) );
		$not_found = array( 'response' => array( 'code' => 404 ) );
		$error     = new \WP_Error( 'http_request_failed', 'Failed.' );
		return array(
			'blocking, 200'         => array( true, $ok, true ),
			'blocking, 404'         => array( true, $not_found, false ),
			'blocking, WP_Error'    => array( true, $error, false ),
			'non-blocking, success' => array( false, array( 'response' => array( 'code' => false ) ), true ),
			'non-blocking, error'   => array( false, $error, false ),
		);
	}
}
