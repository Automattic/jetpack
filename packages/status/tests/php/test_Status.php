<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\Status;
use PHPUnit\Framework\TestCase;
use phpmock\Mock;
use phpmock\MockBuilder;
use Mockery;

class Test_Status extends TestCase {
	/**
	 * Default site URL.
	 *
	 * @var string
	 */
	private $site_url = 'https://yourjetpack.blog';

	/**
	 * Setup before running any of the tests.
	 */
	public static function setUpBeforeClass() {
		if ( ! defined( 'HOUR_IN_SECONDS' ) ) {
			define( 'HOUR_IN_SECONDS', 60 * 60 );
		}
	}

	/**
	 * Test setup.
	 */
	public function setUp() {
		$this->status = new Status();
		\WP_Mock::setUp();
	}

	/**
	 * Test teardown.
	 */
	public function tearDown() {
		\WP_Mock::tearDown();
		Mock::disableAll();
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_development_mode
	 */
	public function test_is_development_mode_default() {
		\WP_Mock::userFunction( 'site_url', $this->site_url );
		\WP_Mock::onFilter( 'jetpack_development_mode' )->with( false )->reply( false );
		\WP_Mock::onFilter( 'jetpack_development_mode' )->with( true )->reply( true );

		$this->assertFalse( $this->status->is_development_mode() );
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_development_mode
	 */
	public function test_is_development_mode_filter_true() {
		\WP_Mock::userFunction( 'site_url', $this->site_url );
		\WP_Mock::onFilter( 'jetpack_development_mode' )->with( false )->reply( true );

		$this->assertTrue( $this->status->is_development_mode() );
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_development_mode
	 */
	public function test_is_development_mode_filter_bool() {
		\WP_Mock::userFunction( 'site_url', $this->site_url );
		\WP_Mock::onFilter( 'jetpack_development_mode' )->with( false )->reply( 0 );

		$this->assertFalse( $this->status->is_development_mode() );
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_development_mode
	 */
	public function test_is_development_mode_localhost() {
		\WP_Mock::userFunction( 'site_url', array( 'return' => 'localhost' ) );
		\WP_Mock::onFilter( 'jetpack_development_mode' )->with( false )->reply( false );
		\WP_Mock::onFilter( 'jetpack_development_mode' )->with( true )->reply( true );

		$this->assertTrue( $this->status->is_development_mode() );
	}

    /**
     * @covers Automattic\Jetpack\Status::is_development_mode
     *
     * @runInSeparateProcess
     */
	public function test_is_development_mode_constant() {
		\WP_Mock::userFunction( 'site_url', $this->site_url );
		\WP_Mock::onFilter( 'jetpack_development_mode' )->with( false )->reply( false );
		\WP_Mock::onFilter( 'jetpack_development_mode' )->with( true )->reply( true );
		$constants_mocks = $this->mock_constants( array(
			array( '\\JETPACK_DEV_DEBUG', true ),
		) );

		$this->assertTrue( $this->status->is_development_mode() );

		array_map( function( $mock ) {
			$mock->disable();
		}, $constants_mocks );
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_multi_network
	 */
	public function test_is_multi_network_not_multisite() {
		\WP_Mock::userFunction( 'is_multisite', array( 'return' => false ) );

		$this->assertFalse( $this->status->is_multi_network() );
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_multi_network
	 */
	public function test_is_multi_network_when_single_network() {
		$this->mock_wpdb_get_var( 1 );
		\WP_Mock::userFunction( 'is_multisite', array( 'return' => true ) );

		$this->assertFalse( $this->status->is_multi_network() );

		$this->clean_mock_wpdb_get_var();
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_multi_network
	 */
	public function test_is_multi_network_when_multiple_networks() {
		$this->mock_wpdb_get_var( 2 );
		\WP_Mock::userFunction( 'is_multisite', array( 'return' => true ) );

		$this->assertTrue( $this->status->is_multi_network() );

		$this->clean_mock_wpdb_get_var();
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_single_user_site
	 */
	public function test_is_single_user_site_with_transient() {
		$this->mock_wpdb_get_var( 3 );
		\WP_Mock::userFunction( 'get_transient', array( 'return' => 1 ) );

		$this->assertTrue( $this->status->is_single_user_site() );

		$this->clean_mock_wpdb_get_var();
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_single_user_site
	 */
	public function test_is_single_user_site_with_one_user() {
		$this->mock_wpdb_get_var( 1 );
		\WP_Mock::userFunction( 'get_transient', array( 'return' => false ) );
		\WP_Mock::userFunction( 'set_transient' );

		$this->assertTrue( $this->status->is_single_user_site() );

		$this->clean_mock_wpdb_get_var();
	}

	/**
	 * @covers Automattic\Jetpack\Status::is_single_user_site
	 */
	public function test_is_single_user_site_with_multiple_users() {
		$this->mock_wpdb_get_var( 3 );
		\WP_Mock::userFunction( 'get_transient', array( 'return' => false ) );
		\WP_Mock::userFunction( 'set_transient' );

		$this->assertFalse( $this->status->is_single_user_site() );

		$this->clean_mock_wpdb_get_var();
	}


	/**
	 * Mock a global function with particular arguments and make it return a certain value.
	 *
	 * @param string $function_name Name of the function.
	 * @param array  $args          Array of argument sets, last value of each set is used as a return value.
	 * @return phpmock\Mock The mock object.
	 */
	protected function mock_function_with_args( $function_name, $args = array() ) {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( $function_name )
			->setFunction(
				function( ...$current_args ) use ( &$args ) {
					foreach ( $args as $arg ) {
						if ( array_slice( $arg, 0, -1 ) === $current_args ) {
							return array_pop( $arg );
						}
					}
				}
			);

		$mock = $builder->build();
		$mock->enable();

		return $mock;
	}

	/**
	 * Mock a set of constants.
	 *
	 * @param array $args Array of sets with constants and their respective values.
	 * @return phpmock\Mock The mock object.
	 */
	protected function mock_constants( $constants = array() ) {
		$prepare_constant = function( $constant ) {
			return array( $constant[0], true );
		};

		return [
			$this->mock_function_with_args( 'defined', array_map( $prepare_constant, $constants ) ),
			$this->mock_function_with_args( 'constant', $constants )
		];
	}

	/**
	 * Mock $wpdb->get_var() and make it return a certain value.
	 *
	 * @param mixed  $return_value  Return value of the function.
	 * @return PHPUnit\Framework\MockObject\MockObject The mock object.
	 */
	protected function mock_wpdb_get_var( $return_value = null ) {
		global $wpdb;

		$wpdb = $this->getMockBuilder( 'Mock_wpdb' )
		             ->setMockClassName( 'wpdb' )
		             ->setMethods( array( 'get_var' ) )
		             ->getMock();
		$wpdb->method( 'get_var' )
		     ->willReturn( $return_value );

		$wpdb->prefix   = 'wp_';
		$wpdb->site     = 'wp_site';
		$wpdb->usermeta = 'wp_usermeta';
	}

	/**
	 * Clean up the existing $wpdb->get_var() mock.
	 */
	protected function clean_mock_wpdb_get_var() {
		global $wpdb;
		unset( $wpdb );
	}

	/**
	 * Tests a WP Engine staging site URL.
	 *
	 * @author  kraftbj
	 * @covers Jetpack::is_staging_site
	 * @since  3.9.0
	 */
	public function test_is_staging_site_will_report_staging_for_wpengine_sites_by_url() {
		\WP_Mock::userFunction( 'site_url', array( 'return' => 'http://bjk.staging.wpengine.com' ) );
		$this->assertTrue( $this->status->is_staging_site() );
	}

	/**
	 * Tests known staging sites.
	 *
	 * @dataProvider get_is_staging_site_known_hosting_providers_data
	 *
	 * @param string $site_url Site URL.
	 */
	public function test_is_staging_site_for_known_hosting_providers( $site_url ) {
		\WP_Mock::userFunction( 'site_url', array( 'return' => $site_url ) );
		$result = $this->status->is_staging_site();
		$this->assertTrue(
			$result,
			sprintf( 'Expected %s to return true for `is_staging_site()', $site_url )
		);
	}

	/**
	 * Known hosting providers.
	 *
	 * @return array
	 */
	public function get_is_staging_site_known_hosting_providers_data() {
		return array(
			'wpengine'   => array(
				'http://bjk.staging.wpengine.com',
			),
			'kinsta'     => array(
				'http://test.staging.kinsta.com',
			),
			'dreampress' => array(
				'http://ebinnion.stage.site',
			),
		);
	}
}
