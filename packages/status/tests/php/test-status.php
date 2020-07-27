<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Status methods
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Status;
use PHPUnit\Framework\TestCase;
use phpmock\Mock;
use phpmock\MockBuilder;
use Brain\Monkey;
use Brain\Monkey\Functions;
use Brain\Monkey\Filters;

/**
 * Status test suite.
 */
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
		Monkey\setUp();
	}

	/**
	 * Test teardown.
	 */
	public function tearDown() {
		// Call Monkey\tearDown(); here, but the following function takes care of it for now.
		Mock::disableAll();
	}

	/**
	 * Test is_offline_mode when not using any filter
	 *
	 * @covers Automattic\Jetpack\Status::is_offline_mode
	 */
	public function test_is_offline_mode_default() {
		Functions\when( 'site_url' )->justReturn( $this->site_url );
		Filters\expectApplied( 'jetpack_development_mode' )->once()->with( false )->andReturn( false );

		$this->assertFalse( $this->status->is_offline_mode() );
	}

	/**
	 * Test is_offline_mode when using the jetpack_development_mode filter
	 *
	 * @covers Automattic\Jetpack\Status::is_offline_mode
	 */
	public function test_is_offline_mode_filter_true() {
		Functions\when( 'site_url' )->justReturn( $this->site_url );
		Filters\expectApplied( 'jetpack_development_mode' )->once()->with( false )->andReturn( true );

		$this->assertTrue( $this->status->is_offline_mode() );
	}

	/**
	 * Test when using a bool value for the jetpack_development_mode filter.
	 *
	 * @covers Automattic\Jetpack\Status::is_offline_mode
	 */
	public function test_is_offline_mode_filter_bool() {
		Functions\when( 'site_url' )->justReturn( $this->site_url );
		Filters\expectApplied( 'jetpack_development_mode' )->once()->with( false )->andReturn( 0 );

		$this->assertFalse( $this->status->is_offline_mode() );
	}

	/**
	 * Test when site url is localhost (dev mode on)
	 *
	 * @covers Automattic\Jetpack\Status::is_offline_mode
	 */
	public function test_is_offline_mode_localhost() {
		Functions\when( 'site_url' )->justReturn( 'localhost' );

		Filters\expectApplied( 'jetpack_development_mode' )->once()->with( false )->andReturn( false );

		$this->assertTrue( $this->status->is_offline_mode() );
	}

	/**
	 * Test when using the constant to set dev mode
	 *
	 * @covers Automattic\Jetpack\Status::is_offline_mode
	 *
	 * @runInSeparateProcess
	 */
	public function test_is_offline_mode_constant() {
		Functions\when( 'site_url' )->justReturn( $this->site_url );
		Filters\expectApplied( 'jetpack_development_mode' )->once()->with( false )->andReturn( false );

		$constants_mocks = $this->mock_constants(
			array(
				array( '\\JETPACK_DEV_DEBUG', true ),
			)
		);

		$this->assertTrue( $this->status->is_offline_mode() );

		array_map(
			function( $mock ) {
				$mock->disable();
			},
			$constants_mocks
		);
	}

	/**
	 * Test for is_multi_network with a single site
	 *
	 * @covers Automattic\Jetpack\Status::is_multi_network
	 */
	public function test_is_multi_network_not_multisite() {
		Functions\when( 'is_multisite' )->justReturn( false );

		$this->assertFalse( $this->status->is_multi_network() );
	}

	/**
	 * Test is_multi_network with a multisite install
	 *
	 * @covers Automattic\Jetpack\Status::is_multi_network
	 */
	public function test_is_multi_network_when_single_network() {
		$this->mock_wpdb_get_var( 1 );
		Functions\when( 'is_multisite' )->justReturn( true );

		$this->assertFalse( $this->status->is_multi_network() );

		$this->clean_mock_wpdb_get_var();
	}

	/**
	 * Test is_multi_network when multiple networks
	 *
	 * @covers Automattic\Jetpack\Status::is_multi_network
	 */
	public function test_is_multi_network_when_multiple_networks() {
		$this->mock_wpdb_get_var( 2 );
		Functions\when( 'is_multisite' )->justReturn( true );

		$this->assertTrue( $this->status->is_multi_network() );

		$this->clean_mock_wpdb_get_var();
	}

	/**
	 * Test cached is_single_user_site
	 *
	 * @covers Automattic\Jetpack\Status::is_single_user_site
	 */
	public function test_is_single_user_site_with_transient() {
		$this->mock_wpdb_get_var( 3 );
		Functions\when( 'get_transient' )->justReturn( 1 );

		$this->assertTrue( $this->status->is_single_user_site() );

		$this->clean_mock_wpdb_get_var();
	}

	/**
	 * Test is_single_user_site
	 *
	 * @covers Automattic\Jetpack\Status::is_single_user_site
	 */
	public function test_is_single_user_site_with_one_user() {
		$this->mock_wpdb_get_var( 1 );
		Functions\when( 'get_transient' )->justReturn( false );
		Functions\when( 'set_transient' )->justReturn( true );

		$this->assertTrue( $this->status->is_single_user_site() );

		$this->clean_mock_wpdb_get_var();
	}

	/**
	 * Test is_single_user_site with multiple users
	 *
	 * @covers Automattic\Jetpack\Status::is_single_user_site
	 */
	public function test_is_single_user_site_with_multiple_users() {
		$this->mock_wpdb_get_var( 3 );
		Functions\when( 'get_transient' )->justReturn( false );
		Functions\when( 'set_transient' )->justReturn( true );

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
	 * @param array $constants Array of sets with constants and their respective values.
	 * @return phpmock\Mock The mock object.
	 */
	protected function mock_constants( $constants = array() ) {
		$prepare_constant = function( $constant ) {
			return array( $constant[0], true );
		};

		return array(
			$this->mock_function_with_args( 'defined', array_map( $prepare_constant, $constants ) ),
			$this->mock_function_with_args( 'constant', $constants ),
		);
	}

	/**
	 * Mock $wpdb->get_var() and make it return a certain value.
	 *
	 * @param mixed $return_value  Return value of the function.
	 *
	 * PHPUnit\Framework\MockObject\MockObject The mock object.
	 */
	protected function mock_wpdb_get_var( $return_value = null ) {
		global $wpdb;

		$wpdb = $this->getMockBuilder( 'Mock_wpdb' ) // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
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
	 * @covers is_staging_site
	 * @since  3.9.0
	 */
	public function test_is_staging_site_will_report_staging_for_wpengine_sites_by_url() {
		Functions\when( 'site_url' )->justReturn( 'http://bjk.staging.wpengine.com' );
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
		Functions\when( 'site_url' )->justReturn( $site_url );
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
			'newspack'   => array(
				'http://test.newspackstaging.com',
			),
		);
	}
}
