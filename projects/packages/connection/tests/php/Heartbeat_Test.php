<?php
/**
 * Tests for the Heartbeat class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Class Heartbeat_Test
 *
 * @covers Automattic\Jetpack\Heartbeat
 */
#[CoversClass( Heartbeat::class )]
class Heartbeat_Test extends BaseTestCase {

	/**
	 * Pre-seed the SSL test transient so `get_environment_stats()` does not make a network request.
	 */
	public function set_up() {
		set_transient( 'jetpack_https_test', 1 );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		delete_transient( 'jetpack_https_test' );
	}

	/**
	 * `get_environment_stats()` returns the expected environment stat keys.
	 */
	public function test_get_environment_stats_returns_expected_keys() {
		$stats = Heartbeat::get_environment_stats();

		$expected_keys = array(
			'wp-version',
			'php-version',
			'wp-branch',
			'php-branch',
			'public',
			'ssl',
			'is-https',
			'language',
			'charset',
			'is-multisite',
			'plugins',
			'space-used',
			'is-multi-network',
		);

		foreach ( $expected_keys as $key ) {
			$this->assertArrayHasKey( $key, $stats );
		}
	}

	/**
	 * `get_environment_stats()` reports the current WordPress and PHP versions.
	 */
	public function test_get_environment_stats_reports_versions() {
		$stats = Heartbeat::get_environment_stats();

		$this->assertSame( get_bloginfo( 'version' ), $stats['wp-version'] );
		$this->assertSame( PHP_VERSION, $stats['php-version'] );
	}

	/**
	 * `get_environment_stats()` uses the cached SSL test result instead of making a request.
	 */
	public function test_get_environment_stats_uses_cached_ssl_result() {
		set_transient( 'jetpack_https_test', 1 );
		$stats = Heartbeat::get_environment_stats();
		$this->assertTrue( $stats['ssl'] );

		set_transient( 'jetpack_https_test', 0 );
		$stats = Heartbeat::get_environment_stats();
		$this->assertFalse( $stats['ssl'] );
	}

	/**
	 * `get_environment_stats()` reports site/network topology for a single-site install.
	 */
	public function test_get_environment_stats_reports_single_site_topology() {
		$stats = Heartbeat::get_environment_stats();

		$this->assertSame( 'singlesite', $stats['is-multisite'] );
		$this->assertSame( 'single-site', $stats['is-multi-network'] );
	}
}
