<?php
/**
 * Tests for Automattic\Jetpack\Status\Hosts methods
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

use Automattic\Jetpack\Constants;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Status test suite.
 *
 * @covers \Automattic\Jetpack\Status\Host
 */
#[CoversClass( Host::class )]
class Host_Test extends TestCase {
	/**
	 * Testing object.
	 *
	 * @var Host
	 */
	private $host_obj;

	/**
	 * Test setup.
	 */
	public function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		Functions\when( 'get_current_blog_id' )->justReturn( 1 );

		Cache::clear();
		$this->host_obj = new Host();
	}

	/**
	 * Test teardown.
	 */
	public function tearDown(): void {
		parent::tearDown();
		Monkey\tearDown();
		Constants::clear_constants();
		Cache::clear();

		unset( $_GET['calypso_env'] );
	}

	/**
	 * Setup Atomic-defining constants.
	 */
	private function setup_atomic_constants() {
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 999 );
		Constants::set_constant( 'ATOMIC_SITE_ID', 999 );
	}

	/**
	 * Sets up the site as a WPCOM Simple site.
	 */
	private function setup_wpcom_simple_constants() {
		Constants::set_constant( 'IS_WPCOM', true );
	}

	/**
	 * Tests if WoA Site based on constant
	 */
	public function test_woa_site_based_on_constant() {
		$this->setup_atomic_constants();
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', true );
		$this->assertTrue( $this->host_obj->is_woa_site() );
		$this->assertTrue( $this->host_obj->is_wpcom_platform() );
	}

	/**
	 * Confirms a site is Atomic, but not WoA
	 */
	public function test_atomic_not_woa() {
		$this->setup_atomic_constants();
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', false );
		$this->assertTrue( $this->host_obj->is_atomic_platform() );
		$this->assertFalse( $this->host_obj->is_woa_site() );
	}

	/**
	 * Test if Atomic site based on constants.
	 */
	public function test_atomic_site_based_on_constants() {
		$this->setup_atomic_constants();
		$this->assertTrue( $this->host_obj->is_atomic_platform() );
	}

	/**
	 * Test that lack of Atomic constants is false.
	 */
	public function test_false_for_not_atomic() {
		Constants::set_constant( 'ATOMIC_CLIENT_ID', false );
		Constants::set_constant( 'ATOMIC_SITE_ID', false );
		$this->assertFalse( $this->host_obj->is_atomic_platform() );
	}

	/**
	 * Tests if a Simple Site based on constant
	 */
	public function test_simple_site_based_on_constant() {
		$this->setup_wpcom_simple_constants();
		$this->assertTrue( $this->host_obj->is_wpcom_simple() );
		$this->assertTrue( $this->host_obj->is_wpcom_platform() );
	}

	/**
	 * Test result is cached.
	 */
	public function test_cached() {
		$this->setup_atomic_constants();
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', true );
		$this->assertTrue( $this->host_obj->is_woa_site() );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', false );
		$this->assertTrue( $this->host_obj->is_woa_site() );
	}

	/**
	 * Tests getting the correct Calypso host.
	 *
	 * @dataProvider get_calypso_env_data_provider
	 *
	 * @param string $env Calypso environment (empty string if default).
	 */
	#[DataProvider( 'get_calypso_env_data_provider' )]
	public function test_get_calypso_env( $env ) {
		if ( $env ) {
			$_GET['calypso_env'] = $env;
		}

		$this->assertEquals( $env, $this->host_obj->get_calypso_env() );
	}

	/**
	 * Data provider for `test_get_calypso_env()` test method.
	 *
	 * @return array
	 */
	public static function get_calypso_env_data_provider() {
		return array(
			'development' => array( 'development' ),
			'wpcalypso'   => array( 'wpcalypso' ),
			'horizon'     => array( 'horizon' ),
			'default'     => array( '' ),
		);
	}

	/**
	 * Test adding a source parameter to the Calypso URL.
	 *
	 * @dataProvider get_source_query_params
	 *
	 * @param string $source Source parameter.
	 * @param string $expected Expected query string.
	 */
	#[DataProvider( 'get_source_query_params' )]
	public function test_get_source_query( $source, $expected ) {
		$_GET['source'] = $source;
		$this->assertEquals( $expected, $this->host_obj->get_source_query() );
		unset( $_GET['source'] );
	}

	/**
	 * Data provider for `test_get_source_query()` test method.
	 *
	 * @return array
	 */
	public static function get_source_query_params() {
		return array(
			'empty'        => array( '', '' ),
			'valid_manage' => array( 'jetpack-manage', 'jetpack-manage' ),
			'valid_a4a'    => array( 'a8c-for-agencies', 'a8c-for-agencies' ),
			'invalid'      => array( 'invalid-param', '' ),
		);
	}

	/**
	 * Tests that is_p2_site() returns true when the stylesheet contains 'pub/p2'.
	 */
	public function test_is_p2_site_true_if_stylesheet_contains_pub_p2() {
		// Make is_wpcom_simple true so get_wpcom_site_id returns a value.
		$this->setup_wpcom_simple_constants();
		Functions\when( 'get_stylesheet' )->justReturn( 'pub/p2-theme' );
		$this->assertTrue( $this->host_obj->is_p2_site() );
	}

	/**
	 * Tests that is_p2_site() returns true when the WPForTeams function exists and returns true.
	 */
	public function test_is_p2_site_true_if_wpforteams_function_exists_and_true() {
		// Mock get_wpcom_site_id to ensure we are testing all existing functions within is_p2_site().
		// Anonymous class to replace method.
		// PHPUnit 12.5 whines about mocks without expectations, while getStubBuilder() (for partial mocks) doesn't exist until 12.5.
		$host = new class() extends Host {
			public function get_wpcom_site_id() {
				return 123;
			}
		};

		Functions\when( 'get_stylesheet' )->justReturn( 'not-p2-theme' );
		Functions\when( 'function_exists' )->alias(
			function ( $fn ) {
				return $fn === '\WPForTeams\is_wpforteams_site';
			}
		);
		Functions\when( '\WPForTeams\is_wpforteams_site' )->justReturn( true );

		$this->assertTrue( $host->is_p2_site() );
	}

	/**
	 * Tests that is_p2_site() returns false when neither the stylesheet nor the WPForTeams function indicate a P2 site.
	 */
	public function test_is_p2_site_false_if_no_conditions_met() {
		$this->setup_wpcom_simple_constants();
		Functions\when( 'get_stylesheet' )->justReturn( 'not-p2-theme' );
		Functions\when( 'function_exists' )->alias(
			function ( $fn ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return false;
			}
		);
		$this->assertFalse( $this->host_obj->is_p2_site() );
	}
}
