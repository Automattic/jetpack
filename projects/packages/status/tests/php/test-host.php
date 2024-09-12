<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Status\Hosts methods
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

use Automattic\Jetpack\Constants;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Status test suite.
 */
class Test_Host extends TestCase {
	/**
	 * Testing object.
	 *
	 * @var Host
	 */
	private $host_obj;

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();

		Functions\when( 'get_current_blog_id' )->justReturn( 1 );

		Cache::clear();
		$this->host_obj = new Host();
	}

	/**
	 * Test teardown.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
		Constants::clear_constants();
		Cache::clear();

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
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
		Constants::set_constant( 'IS_WPCOM', true );
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
	 * @covers Automattic\Jetpack\Status\Host::get_calypso_env
	 * @dataProvider get_calypso_env_data_provider
	 *
	 * @param string $env Calypso environment (empty string if default).
	 */
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
	public function get_calypso_env_data_provider() {
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
	 * @covers Automattic\Jetpack\Status\Host::get_source_query
	 * @dataProvider get_source_query_params
	 *
	 * @param string $source Source parameter.
	 * @param string $expected Expected query string.
	 */
	public function test_get_source_query( $source, $expected ) {
		$_GET['source'] = $source;
		$this->assertEquals( $expected, $this->host_obj->get_source_query( $source ) );
		unset( $_GET['source'] );
	}

	/**
	 * Test getting the known host guess.
	 *
	 * @covers Automattic\Jetpack\Status\Host::get_nameserver_dns_records
	 */
	public function test_get_nameserver_dns_records() {
		Functions\when( 'dns_get_record' )->justReturn(
			array(
				array( 'target' => 'ns1.wordpress.com' ),
				array( 'target' => 'ns2.wordpress.com' ),
			)
		);

		$domain  = 'example.com';
		$records = $this->host_obj->get_nameserver_dns_records( $domain );
		$this->assertEquals( array( 'ns1.wordpress.com', 'ns2.wordpress.com' ), $records );
	}

	/**
	 * Test getting the known host guess.
	 *
	 * @covers Automattic\Jetpack\Status\Host::get_hosting_provider_by_nameserver
	 */
	public function test_get_hosting_provider_by_nameserver() {
		$mock = $this->createPartialMock( Host::class, array( 'get_nameserver_dns_records' ) );

		$mock->method( 'get_nameserver_dns_records' )
			->willReturn( array( 'ns1.bluehost.com', 'ns2.bluehost.com' ) );

		$provider = $mock->get_hosting_provider_by_nameserver( 'example.com' );
		$this->assertEquals( 'bluehost', $provider );
	}

	/**
	 * Test getting the known host guess.
	 *
	 * @covers Automattic\Jetpack\Status\Host::get_known_host_guess
	 */
	public function test_get_known_host_guess() {
		Functions\when( 'sanitize_text_field' )->alias(
			function ( $value ) {
				return $value;
			}
		);
		$_SERVER['SERVER_NAME'] = 'mocked.example.com';

		$mock1 = $this->createPartialMock( Host::class, array( 'get_hosting_provider_by_nameserver' ) );

		$mock1->method( 'get_hosting_provider_by_nameserver' )
			->willReturn( 'bluehost' );

		$this->assertEquals( 'bluehost', $mock1->get_known_host_guess() );
		Cache::clear();

		$mock2 = $this->createPartialMock( Host::class, array( 'is_atomic_platform' ) );

		$mock2->method( 'is_atomic_platform' )
			->willReturn( true );

		$this->assertEquals( 'atomic', $mock2->get_known_host_guess() );
		Cache::clear();

		$this->assertEquals( 'unknown', $this->host_obj->get_known_host_guess() );
		Cache::clear();
	}

	/**
	 * Data provider for `test_get_source_query()` test method.
	 *
	 * @return array
	 */
	public function get_source_query_params() {
		return array(
			'empty'        => array( '', '' ),
			'valid_manage' => array( 'jetpack-manage', 'jetpack-manage' ),
			'valid_a4a'    => array( 'a8c-for-agencies', 'a8c-for-agencies' ),
			'invalid'      => array( 'invalid-param', '' ),
		);
	}
}
