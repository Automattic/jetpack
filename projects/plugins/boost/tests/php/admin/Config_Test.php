<?php

namespace Automattic\Jetpack_Boost\Tests\Admin;

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack_Boost\Admin\Config;
use Brain\Monkey\Functions;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Config_Test extends TestCase {
	private $registered_pages;

	protected function setUp(): void {
		parent::setUp();
		\Brain\Monkey\setUp();
		Functions\when( 'get_current_blog_id' )->justReturn( 1 );
		Functions\when( 'get_plugin_page_hookname' )->justReturn( 'jetpack_page_my-jetpack' );
		Functions\when( 'current_user_can' )->justReturn( true );
		$this->registered_pages                                  = $GLOBALS['_registered_pages'] ?? null;
		$GLOBALS['_registered_pages']['jetpack_page_my-jetpack'] = true;

		// Define required constants if they're not already defined
		if ( ! defined( 'JETPACK_BOOST_VERSION' ) ) {
			define( 'JETPACK_BOOST_VERSION', '1.0.0' );
		}
		if ( ! defined( 'JETPACK_BOOST_PLUGINS_DIR_URL' ) ) {
			define( 'JETPACK_BOOST_PLUGINS_DIR_URL', 'http://example.com/wp-content/plugins/jetpack-boost/' );
		}
		if ( ! defined( 'JETPACK_BOOST_PATH' ) ) {
			define( 'JETPACK_BOOST_PATH', '/path/to/jetpack-boost/' );
		}
		if ( ! defined( 'JETPACK_BOOST_REST_NAMESPACE' ) ) {
			define( 'JETPACK_BOOST_REST_NAMESPACE', 'jetpack-boost/v1' );
		}
		if ( ! defined( 'JETPACK_BOOST_REST_PREFIX' ) ) {
			define( 'JETPACK_BOOST_REST_PREFIX', 'jetpack/v4' );
		}
	}

	protected function tearDown(): void {
		$GLOBALS['_registered_pages'] = $this->registered_pages;
		Mockery::close();
		\Brain\Monkey\tearDown();
		parent::tearDown();
	}

	protected function setupCommonMocks() {
		// Mock WordPress functions
		Functions\when( 'get_bloginfo' )
			->alias(
				function ( $show ) {
					if ( $show === 'version' ) {
							return '6.0.0';
					}
					return '';
				}
			);
		Functions\when( 'plugins_url' )
			->alias(
				function ( $path = '' ) {
					return 'http://example.com/wp-content/plugins/jetpack-boost/app/assets/dist' . ( $path ? '/' . ltrim( $path, '/' ) : '' );
				}
			);
		Functions\when( 'wp_image_editor_supports' )
			->alias(
				function ( $args ) {
					if ( isset( $args['methods'] ) && in_array( 'resize', $args['methods'], true ) ) {
							return true;
					}
					return false;
				}
			);
		Functions\when( 'get_home_url' )->justReturn( 'http://example.com' );
		Functions\when( 'get_post_types' )->justReturn( array() );
		Functions\when( 'is_post_type_viewable' )->justReturn( true );
		Functions\when( 'wp_list_pluck' )->justReturn( array() );
		Functions\when( 'wp_get_environment_type' )->justReturn( 'production' );
		Functions\when( 'get_option' )->alias(
			function ( $option ) {
				if ( 'blog_public' === $option ) {
						return '1';
				}
				return null;
			}
		);

		// Mock Status class
		$status = Mockery::mock( 'overload:' . Status::class );
		$status->shouldReceive( 'get_site_suffix' )->andReturn( 'example.com' );
		$status->shouldReceive( 'is_offline_mode' )->andReturn( false );
		$status->shouldReceive( 'is_private_site' )->andReturn( false );
	}

	/**
	 * @dataProvider licensing_states
	 */
	#[DataProvider( 'licensing_states' )]
	public function test_constants( $my_jetpack_available, $licensing_enabled ) {
		$this->setupCommonMocks();

		// Set up filter expectations in correct order
		Functions\expect( 'apply_filters' )
			->once()
			->with( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' )
			->andReturn( 'app/assets/dist/' );

		Functions\expect( 'apply_filters' )
			->times( $my_jetpack_available ? 1 : 0 )
			->with( 'jetpack_my_jetpack_should_enable_add_license_screen', true )
			->andReturn( $licensing_enabled );

		// This filter needs to return the constants array
		Functions\expect( 'apply_filters' )
			->once()
			->with( 'jetpack_boost_js_constants', Mockery::type( 'array' ) )
			->andReturnUsing(
				function ( $hook, $constants ) {
					$this->assertIsArray( $constants ); // Verify we're getting an array
					return $constants; // Return the array unchanged
				}
			);

		Functions\when( 'did_action' )->justReturn( (int) $my_jetpack_available );

		// Mock Host class for this specific test
		$host = Mockery::mock( 'overload:' . Host::class );
		$host->shouldReceive( 'is_woa_site' )->andReturn( false );
		$host->shouldReceive( 'is_atomic_platform' )->andReturn( true );

		$config = new Config();
		$result = $config->constants();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'version', $result );
		$this->assertTrue( $result['canResizeImages'] );
		$this->assertEquals( 'http://example.com', $result['site']['url'] );
		$this->assertEquals( 'atomic', $result['site']['host'] );
		$this->assertTrue( $result['site']['online'] );
		$this->assertSame( $my_jetpack_available, $result['site']['myJetpack'] );
		$this->assertSame( $licensing_enabled, $result['site']['addLicense'] );
	}

	public static function licensing_states() {
		return array(
			'enabled'     => array( true, true ),
			'disabled'    => array( true, false ),
			'unavailable' => array( false, false ),
		);
	}

	public function test_constants_private_site() {
		// First, set up basic mocks
		Functions\when( 'get_bloginfo' )
			->alias(
				function ( $show ) {
					if ( $show === 'version' ) {
							return '6.0.0';
					}
					return '';
				}
			);
		Functions\when( 'plugins_url' )
			->alias(
				function ( $path = '' ) {
					return 'http://example.com/wp-content/plugins/jetpack-boost/app/assets/dist' . ( $path ? '/' . ltrim( $path, '/' ) : '' );
				}
			);
		Functions\when( 'wp_image_editor_supports' )
			->alias(
				function ( $args ) {
					if ( isset( $args['methods'] ) && in_array( 'resize', $args['methods'], true ) ) {
							return true;
					}
					return false;
				}
			);
		Functions\when( 'get_home_url' )->justReturn( 'http://example.com' );
		Functions\when( 'get_post_types' )->justReturn( array() );
		Functions\when( 'is_post_type_viewable' )->justReturn( true );
		Functions\when( 'wp_list_pluck' )->justReturn( array() );
		Functions\when( 'wp_get_environment_type' )->justReturn( 'production' );

		// Set up filter expectations
		Functions\expect( 'apply_filters' )
			->once()
			->with( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' )
			->andReturn( 'app/assets/dist/' );

		Functions\expect( 'apply_filters' )
			->once()
			->with( 'jetpack_boost_js_constants', Mockery::type( 'array' ) )
			->andReturnUsing(
				function ( $hook, $constants ) {
					return $constants;
				}
			);

		Functions\when( 'did_action' )->justReturn( 1 );

		// Create a fresh Status mock for private site
		$status = Mockery::mock( 'overload:' . Status::class );
		$status->shouldReceive( 'get_site_suffix' )->andReturn( 'example.com' );
		$status->shouldReceive( 'is_offline_mode' )->andReturn( false );
		$status->shouldReceive( 'is_private_site' )->andReturn( true );

		// Mock Host class
		$host = Mockery::mock( 'overload:' . Host::class );
		$host->shouldReceive( 'is_woa_site' )->andReturn( false );
		$host->shouldReceive( 'is_atomic_platform' )->andReturn( true );

		// Create new instance and test
		$config = new Config();
		$result = $config->constants();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'site', $result );
		$this->assertArrayHasKey( 'online', $result['site'] );
		$this->assertFalse(
			$result['site']['online'],
			'Site should be offline when Status::is_private_site() returns true'
		);
	}

	public function test_my_jetpack_unavailable_when_not_initialized() {
		Functions\expect( 'did_action' )->once()->with( 'my_jetpack_init' )->andReturn( 0 );

		$this->assertFalse( Config::is_my_jetpack_available() );
	}

	public function test_my_jetpack_availability_tracks_registered_page() {
		Functions\when( 'did_action' )->justReturn( 1 );
		unset( $GLOBALS['_registered_pages']['jetpack_page_my-jetpack'] );

		$this->assertFalse( Config::is_my_jetpack_available() );
		$GLOBALS['_registered_pages']['jetpack_page_my-jetpack'] = true;
		$this->assertTrue( Config::is_my_jetpack_available() );
	}

	public function test_get_hosting_provider_woa() {
		$this->setupCommonMocks();

		// Mock Host class specifically for WOA test
		$host = Mockery::mock( 'overload:' . Host::class );
		$host->shouldReceive( 'is_woa_site' )->once()->andReturn( true );
		$host->shouldReceive( 'is_atomic_platform' )->never();

		$result = Config::get_hosting_provider();
		$this->assertEquals( 'woa', $result );
	}

	public function test_get_hosting_provider_other() {
		$this->setupCommonMocks();

		// Mock Host class specifically for 'other' test
		$host = Mockery::mock( 'overload:' . Host::class );
		$host->shouldReceive( 'is_woa_site' )->once()->andReturn( false );
		$host->shouldReceive( 'is_atomic_platform' )->once()->andReturn( false );

		$result = Config::get_hosting_provider();
		$this->assertEquals( 'other', $result );
	}

	public function test_get_custom_post_types() {
		$this->setupCommonMocks();

		$mock_post_types = array(
			'book'       => (object) array(
				'name'  => 'book',
				'label' => 'Books',
			),
			'movie'      => (object) array(
				'name'  => 'movie',
				'label' => 'Movies',
			),
			'attachment' => (object) array(
				'name'  => 'attachment',
				'label' => 'Attachments',
			),
		);

		Functions\when( 'get_post_types' )->justReturn( $mock_post_types );
		Functions\when( 'is_post_type_viewable' )->justReturn( true );
		Functions\when( 'wp_list_pluck' )->justReturn(
			array(
				'book'  => 'Books',
				'movie' => 'Movies',
			)
		);

		$reflection = new \ReflectionClass( Config::class );
		$method     = $reflection->getMethod( 'get_custom_post_types' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invokeArgs( new Config(), array() );

		$this->assertIsArray( $result );
		$this->assertArrayNotHasKey( 'attachment', $result );
		$this->assertArrayHasKey( 'book', $result );
		$this->assertArrayHasKey( 'movie', $result );
	}
}
