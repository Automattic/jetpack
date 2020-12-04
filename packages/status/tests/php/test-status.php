<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Status methods
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack;

use Brain\Monkey;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

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
	 * Status instance.
	 *
	 * @var Automattic\Jetpack\Status
	 */
	private $status_obj;

	/**
	 * Mocked constants.
	 *
	 * @var array
	 */
	private $mocked_constants = array();

	/**
	 * Setup before running any of the tests.
	 *
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		if ( ! defined( 'HOUR_IN_SECONDS' ) ) {
			define( 'HOUR_IN_SECONDS', 60 * 60 );
		}
	}

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();

		// Set defaults for Core functionality.
		Functions\when( 'site_url' )->justReturn( $this->site_url );
		Functions\when( 'wp_get_environment_type' )->justReturn( 'production' );
		Functions\when( 'wp_parse_url' )->alias( 'parse_url' );
		Functions\expect( 'defined' )->andReturnUsing(
			function ( $const ) {
				return array_key_exists( $const, $this->mocked_constants ) ? true : defined( $const );
			}
		);
		Functions\expect( 'constant' )->andReturnUsing(
			function ( $const ) {
				return array_key_exists( $const, $this->mocked_constants ) ? $this->mocked_constants[ $const ] : constant( $const );
			}
		);

		$this->status_obj = new Status();
	}

	/**
	 * Test teardown.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
	}

	/**
	 * Test is_offline_mode when not using any filter
	 *
	 * @covers Automattic\Jetpack\Status::is_offline_mode
	 */
	public function test_is_offline_mode_default() {
		Filters\expectApplied( 'jetpack_offline_mode' )->once()->with( false )->andReturn( false );

		$this->assertFalse( $this->status_obj->is_offline_mode() );
	}

	/**
	 * Test is_offline_mode when using the jetpack_offline_mode filter
	 *
	 * @covers Automattic\Jetpack\Status::is_offline_mode
	 */
	public function test_is_offline_mode_filter_true() {
		Filters\expectApplied( 'jetpack_offline_mode' )->once()->with( false )->andReturn( true );

		$this->assertTrue( $this->status_obj->is_offline_mode() );
	}

	/**
	 * Test when using a bool value for the jetpack_offline_mode filter.
	 *
	 * @covers Automattic\Jetpack\Status::is_offline_mode
	 */
	public function test_is_offline_mode_filter_bool() {
		Filters\expectApplied( 'jetpack_offline_mode' )->once()->with( false )->andReturn( 0 );

		$this->assertFalse( $this->status_obj->is_offline_mode() );
	}

	/**
	 * Test when site url is localhost (dev mode on)
	 *
	 * @covers Automattic\Jetpack\Status::is_offline_mode
	 */
	public function test_is_offline_mode_localhost() {
		Functions\when( 'site_url' )->justReturn( 'localhost' );

		Filters\expectApplied( 'jetpack_offline_mode' )->once()->with( true )->andReturn( true );

		$this->assertTrue( $this->status_obj->is_offline_mode() );
	}

	/**
	 * Test when wp_get_environment_type is local.
	 *
	 * @covers Automattic\Jetpack\Status::is_local_site
	 */
	public function test_is_local_wp_get_environment_type_local() {
		Functions\when( 'wp_get_environment_type' )->justReturn( 'local' );

		Filters\expectApplied( 'jetpack_is_local_site' )->once()->with( true )->andReturn( true );

		$this->assertTrue( $this->status_obj->is_local_site() );
	}

	/**
	 * Test when wp_get_environment_type is local.
	 *
	 * @covers Automattic\Jetpack\Status::is_staging_site
	 */
	public function test_is_staging_wp_get_environment_type_local() {
		Functions\when( 'wp_get_environment_type' )->justReturn( 'local' );

		Filters\expectApplied( 'jetpack_is_staging_site' )->once()->with( false )->andReturn( false );

		$this->assertFalse( $this->status_obj->is_staging_site() );
	}

	/**
	 * Test when wp_get_environment_type is staging.
	 *
	 * @covers Automattic\Jetpack\Status::is_staging_site
	 */
	public function test_is_staging_wp_get_environment_type_staging() {
		Functions\when( 'wp_get_environment_type' )->justReturn( 'staging' );

		Filters\expectApplied( 'jetpack_is_staging_site' )->once()->with( true )->andReturn( true );

		$this->assertTrue( $this->status_obj->is_staging_site() );
	}

	/**
	 * Test when wp_get_environment_type is production.
	 *
	 * @covers Automattic\Jetpack\Status::is_staging_site
	 */
	public function test_is_staging_wp_get_environment_type_production() {
		Functions\when( 'wp_get_environment_type' )->justReturn( 'production' );

		Filters\expectApplied( 'jetpack_is_staging_site' )->once()->with( false )->andReturn( false );

		$this->assertFalse( $this->status_obj->is_staging_site() );
	}

	/**
	 * Test when wp_get_environment_type is a random value.
	 *
	 * @covers Automattic\Jetpack\Status::is_staging_site
	 */
	public function test_is_staging_wp_get_environment_type_random() {
		Functions\when( 'wp_get_environment_type' )->justReturn( 'random_string' );

		Filters\expectApplied( 'jetpack_is_staging_site' )->once()->with( true )->andReturn( true );

		$this->assertTrue( $this->status_obj->is_staging_site() ); // We assume a site is a staging site for any non-local or non-production value.
	}

	/**
	 * Test when using the constant to set dev mode
	 *
	 * @covers Automattic\Jetpack\Status::is_offline_mode
	 *
	 * @runInSeparateProcess
	 */
	public function test_is_offline_mode_constant() {
		Filters\expectApplied( 'jetpack_offline_mode' )->once()->with( true )->andReturn( true );
		$this->mocked_constants['\\JETPACK_DEV_DEBUG'] = true;

		$this->assertTrue( $this->status_obj->is_offline_mode() );
	}

	/**
	 * Test for is_multi_network with a single site
	 *
	 * @covers Automattic\Jetpack\Status::is_multi_network
	 */
	public function test_is_multi_network_not_multisite() {
		Functions\when( 'is_multisite' )->justReturn( false );

		$this->assertFalse( $this->status_obj->is_multi_network() );
	}

	/**
	 * Test is_multi_network with a multisite install
	 *
	 * @covers Automattic\Jetpack\Status::is_multi_network
	 */
	public function test_is_multi_network_when_single_network() {
		$this->mock_wpdb_get_var( 1 );
		Functions\when( 'is_multisite' )->justReturn( true );

		$this->assertFalse( $this->status_obj->is_multi_network() );

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

		$this->assertTrue( $this->status_obj->is_multi_network() );

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

		$this->assertTrue( $this->status_obj->is_single_user_site() );

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

		$this->assertTrue( $this->status_obj->is_single_user_site() );

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

		$this->assertFalse( $this->status_obj->is_single_user_site() );

		$this->clean_mock_wpdb_get_var();
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
	 * Tests known staging sites.
	 *
	 * @dataProvider get_is_staging_site_known_hosting_providers_data
	 * @covers Automattic\Jetpack\Status::is_staging_site
	 *
	 * @param string $site_url Site URL.
	 * @param bool   $expected Expected return.
	 */
	public function test_is_staging_site_for_known_hosting_providers( $site_url, $expected ) {
		Functions\when( 'site_url' )->justReturn( $site_url );
		$result = $this->status_obj->is_staging_site();
		$this->assertSame(
			$expected,
			$result,
			sprintf(
				'Expected %1$s to return %2$s for is_staging_site()',
				$site_url,
				var_export( $expected, 1 ) // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export
			)
		);
	}

	/**
	 * Known hosting providers.
	 *
	 * Including a couple of general RegEx checks (subdir, ending slash).
	 *
	 * @return array
	 */
	public function get_is_staging_site_known_hosting_providers_data() {
		return array(
			'wpengine'              => array(
				'http://bjk.staging.wpengine.com',
				true,
			),
			'kinsta'                => array(
				'http://test.staging.kinsta.com',
				true,
			),
			'dreampress'            => array(
				'http://ebinnion.stage.site',
				true,
			),
			'newspack'              => array(
				'http://test.newspackstaging.com',
				true,
			),
			'wpengine_subdirectory' => array(
				'http://bjk.staging.wpengine.com/staging',
				true,
			),
			'wpengine_endslash'     => array(
				'http://bjk.staging.wpengine.com/',
				true,
			),
			'not_a_staging_site'    => array(
				'http://staging.wpengine.com.example.com/',
				false,
			),
		);
	}

	/**
	 * Tests known local development sites.
	 *
	 * @dataProvider get_is_local_site_known_tld
	 *
	 * @param string $site_url Site URL.
	 * @param bool   $expected_response Expected response.
	 */
	public function test_is_local_site_for_known_tld( $site_url, $expected_response ) {
		Functions\when( 'site_url' )->justReturn( $site_url );
		$result = $this->status_obj->is_local_site();
		$this->assertEquals(
			$expected_response,
			$result,
			sprintf(
				'Expected %1$s to return %2$s for is_local_site()',
				$site_url,
				$expected_response
			)
		);
	}

	/**
	 * Known hosting providers.
	 *
	 * @return array
	 */
	public function get_is_local_site_known_tld() {
		return array(
			'vvv'            => array(
				'http://jetpack.test',
				true,
			),
			'docksal'        => array(
				'http://jetpack.docksal',
				true,
			),
			'serverpress'    => array(
				'http://jetpack.dev.cc',
				true,
			),
			'lando'          => array(
				'http://jetpack.lndo.site',
				true,
			),
			'test_subdomain' => array(
				'https://test.jetpack.com',
				false,
			),
			'test_in_domain' => array(
				'https://jetpack.test.jetpack.com',
				false,
			),
		);
	}

	/**
	 * Tests for site_suffix().
	 *
	 * @covers Automattic\Jetpack\Status::get_site_suffix
	 * @dataProvider get_site_suffix_examples
	 *
	 * @param string $site     Given site URL.
	 * @param string $expected Site suffix.
	 */
	public function test_jetpack_get_site_suffix( $site, $expected ) {
		Functions\when( 'home_url' )->justReturn( $this->site_url );
		$suffix = $this->status_obj->get_site_suffix( $site );

		$this->assertSame( $expected, $suffix );
	}

	/**
	 * Examples of sites passed to get_site_suffix
	 *
	 * @covers Automattic\Jetpack\Status::get_site_suffix
	 */
	public function get_site_suffix_examples() {
		return array(
			'no_site_home_url' => array(
				'',
				'yourjetpack.blog',
			),
			'tld'              => array(
				'https://example.org',
				'example.org',
			),
			'subdomain'        => array(
				'https://borussia.dortmund.example.org',
				'borussia.dortmund.example.org',
			),
			'subfolder'        => array(
				'https://example.org/borussia-dortmund',
				'example.org::borussia-dortmund',
			),
			'ip'               => array(
				'127.0.0.1',
				'127.0.0.1',
			),
			'no_tld'           => array(
				'https://localhost',
				'localhost',
			),
			'double_domain'    => array(
				'https://example.org/http://example.com',
				'example.org::http:::::example.com',
			),
		);
	}
}
