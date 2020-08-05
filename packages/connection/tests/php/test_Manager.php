<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Connection Manager functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

require_once __DIR__ . '/mock/trait-options.php';
require_once __DIR__ . '/mock/trait-hooks.php';

use Automattic\Jetpack\Connection\Test\Mock\Hooks;
use Automattic\Jetpack\Connection\Test\Mock\Options;
use Automattic\Jetpack\Constants;
use phpmock\Mock;
use phpmock\MockBuilder;
use phpmock\MockEnabledException;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * Connection Manager functionality testing.
 */
class ManagerTest extends TestCase {

	use Options, Hooks;

	/**
	 * Temporary stack for `wp_redirect`.
	 *
	 * @var array
	 */
	protected $arguments_stack = array();

	const DEFAULT_TEST_CAPS = array( 'default_test_caps' );

	/**
	 * Initialize the object before running the test method.
	 */
	public function setUp() {
		$this->manager = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->setMethods( array( 'get_access_token' ) )
			->getMock();

		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
				->setName( 'apply_filters' )
				->setFunction(
					function( $filter_name, $return_value ) {
						return $return_value;
					}
				);

		$this->apply_filters            = $builder->build();
		$this->apply_filters_deprecated = $builder->build();

		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
				->setName( 'wp_redirect' )
				->setFunction(
					function( $url ) {
						$this->arguments_stack['wp_redirect'] [] = array( $url );
						return true;
					}
				);

		$this->wp_redirect = $builder->build();

		// Mock the apply_filters() call in Constants::get_constant().
		$builder = new MockBuilder();
		$builder->setNamespace( 'Automattic\Jetpack' )
				->setName( 'apply_filters' )
				->setFunction(
					function( $filter_name, $value, $name ) {
						return constant( __NAMESPACE__ . "\Utils::DEFAULT_$name" );
					}
				);
		$this->constants_apply_filters = $builder->build();

		$this->build_mock_options();
		$this->build_mock_actions();
	}

	/**
	 * Clean up the testing environment.
	 */
	public function tearDown() {
		WorDBless_Options::init()->clear_options();
		unset( $this->manager );
		Constants::clear_constants();
		Mock::disableAll();
	}

	/**
	 * Test the `is_active` functionality when connected.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_active
	 */
	public function test_is_active_when_connected() {
		$access_token = (object) array(
			'secret'           => 'abcd1234',
			'external_user_id' => 1,
		);
		$this->manager->expects( $this->once() )
			->method( 'get_access_token' )
			->will( $this->returnValue( $access_token ) );

		$this->assertTrue( $this->manager->is_active() );
	}

	/**
	 * Test the `is_active` functionality when not connected.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_active
	 */
	public function test_is_active_when_not_connected() {
		$this->manager->expects( $this->once() )
			->method( 'get_access_token' )
			->will( $this->returnValue( false ) );

		$this->assertFalse( $this->manager->is_active() );
	}

	/**
	 * Test the `api_url` generation.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::api_url
	 */
	public function test_api_url_defaults() {
		$this->apply_filters->enable();

		add_filter( 'jetpack_constant_default_value', array( $this, 'filter_api_constant' ), 10, 2 );

		$this->assertEquals(
			'https://jetpack.wordpress.com/jetpack.something/1/',
			$this->manager->api_url( 'something' )
		);
		$this->assertEquals(
			'https://jetpack.wordpress.com/jetpack.another_thing/1/',
			$this->manager->api_url( 'another_thing/' )
		);

		remove_filter( 'jetpack_constant_default_value', array( $this, 'filter_api_constant' ), 10, 2 );
	}

	/**
	 * Testing the ability of the api_url method to follow set constants and filters.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::api_url
	 */
	public function test_api_url_uses_constants_and_filters() {
		$this->apply_filters->enable();
		$this->constants_apply_filters->enable();

		Constants::set_constant( 'JETPACK__API_BASE', 'https://example.com/api/base.' );
		Constants::set_constant( 'JETPACK__API_VERSION', '1' );
		$this->assertEquals(
			'https://example.com/api/base.something/1/',
			$this->manager->api_url( 'something' )
		);

		Constants::set_constant( 'JETPACK__API_BASE', 'https://example.com/api/another.' );
		Constants::set_constant( 'JETPACK__API_VERSION', '99' );
		$this->assertEquals(
			'https://example.com/api/another.something/99/',
			$this->manager->api_url( 'something' )
		);

		$this->apply_filters->disable();

		$overwrite_filter = function() {
			$this->arguments_stack['jetpack_api_url'][] = array_merge( array( 'jetpack_api_url' ), func_get_args() );
			return 'completely overwrite';
		};
		add_filter( 'jetpack_api_url', $overwrite_filter, 10, 4 );

		$this->assertEquals(
			'completely overwrite',
			$this->manager->api_url( 'something' )
		);

		// The jetpack_api_url argument stack should not be empty, making sure the filter was
		// called with a proper name and arguments.
		$call_arguments = array_pop( $this->arguments_stack['jetpack_api_url'] );
		$this->assertEquals( 'something', $call_arguments[2] );
		$this->assertEquals(
			Constants::get_constant( 'JETPACK__API_BASE' ),
			$call_arguments[3]
		);
		$this->assertEquals(
			'/' . Constants::get_constant( 'JETPACK__API_VERSION' ) . '/',
			$call_arguments[4]
		);

		remove_filter( 'jetpack_api_url', $overwrite_filter, 10 );
	}

	/**
	 * Test the `is_user_connected` functionality.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_user_connected
	 */
	public function test_is_user_connected_with_default_user_id_logged_out() {
		$this->mock_function( 'get_current_user_id', 0 );

		$this->assertFalse( $this->manager->is_user_connected() );
	}

	/**
	 * Test the `is_user_connected` functionality.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_user_connected
	 */
	public function test_is_user_connected_with_false_user_id_logged_out() {
		$this->mock_function( 'get_current_user_id', 0 );

		$this->assertFalse( $this->manager->is_user_connected( false ) );
	}

	/**
	 * Test the `is_user_connected` functionality
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_user_connected
	 */
	public function test_is_user_connected_with_user_id_logged_out_not_connected() {
		$this->mock_function( 'absint', 1 );
		$this->manager->expects( $this->once() )
			->method( 'get_access_token' )
			->will( $this->returnValue( false ) );

		$this->assertFalse( $this->manager->is_user_connected( 1 ) );
	}


	/**
	 * Test the `is_user_connected` functionality.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_user_connected
	 */
	public function test_is_user_connected_with_default_user_id_logged_in() {
		$this->mock_function( 'get_current_user_id', 1 );
		$access_token = (object) array(
			'secret'           => 'abcd1234',
			'external_user_id' => 1,
		);
		$this->manager->expects( $this->once() )
			->method( 'get_access_token' )
			->will( $this->returnValue( $access_token ) );

		$this->assertTrue( $this->manager->is_user_connected() );
	}

	/**
	 * Test the `is_user_connected` functionality.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_user_connected
	 */
	public function test_is_user_connected_with_user_id_logged_in() {
		$this->mock_function( 'absint', 1 );
		$access_token = (object) array(
			'secret'           => 'abcd1234',
			'external_user_id' => 1,
		);
		$this->manager->expects( $this->once() )
			->method( 'get_access_token' )
			->will( $this->returnValue( $access_token ) );

		$this->assertTrue( $this->manager->is_user_connected( 1 ) );
	}

	/**
	 * Unit test for the "Delete all tokens" functionality.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::delete_all_connection_tokens
	 * @throws MockEnabledException PHPUnit wasn't able to enable mock functions.
	 */
	public function test_delete_all_connection_tokens() {
		$this->update_option->enable();
		$this->get_option->enable();
		$this->apply_filters->enable();
		$this->do_action->enable();

		( new Plugin( 'plugin-slug-1' ) )->add( 'Plugin Name 1' );

		( new Plugin( 'plugin-slug-2' ) )->add( 'Plugin Name 2' );

		$stub = $this->createMock( Plugin::class );
		$stub->method( 'is_only' )
			->willReturn( false );
		$manager = ( new Manager() )->set_plugin_instance( $stub );

		$this->assertFalse( $manager->delete_all_connection_tokens() );
	}

	/**
	 * Unit test for the "Disconnect from WP" functionality.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::disconnect_site_wpcom
	 * @throws MockEnabledException PHPUnit wasn't able to enable mock functions.
	 */
	public function test_disconnect_site_wpcom() {
		$this->update_option->enable();
		$this->get_option->enable();
		$this->apply_filters->enable();
		$this->do_action->enable();

		( new Plugin( 'plugin-slug-1' ) )->add( 'Plugin Name 1' );

		( new Plugin( 'plugin-slug-2' ) )->add( 'Plugin Name 2' );

		$stub = $this->createMock( Plugin::class );
		$stub->method( 'is_only' )
			->willReturn( false );
		$manager = ( new Manager() )->set_plugin_instance( $stub );

		$this->assertFalse( $manager->disconnect_site_wpcom() );
	}

	/**
	 * Test the `jetpack_connection_custom_caps' method.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::jetpack_connection_custom_caps
	 * @dataProvider jetpack_connection_custom_caps_data_provider
	 *
	 * @param bool   $in_offline_mode Whether offline mode is active.
	 * @param string $custom_cap The custom capability that is being tested.
	 * @param array  $expected_caps The expected output.
	 */
	public function test_jetpack_connection_custom_caps( $in_offline_mode, $custom_cap, $expected_caps ) {
		$this->apply_filters_deprecated->enable();
		// Mock the site_url call in Status::is_offline_mode.
		$this->mock_function( 'site_url', false, 'Automattic\Jetpack' );

		// Mock the apply_filters_deprecated( 'jetpack_development_mode' ) call in Status->is_offline_mode.
		$this->mock_function( 'apply_filters_deprecated', false, 'Automattic\Jetpack' );

		$this->apply_filters->disable();
		// Mock the apply_filters( 'jetpack_offline_mode', ) call in Status::is_offline_mode.
		add_filter(
			'jetpack_offline_mode',
			function() use ( $in_offline_mode ) {
				return $in_offline_mode;
			}
		);

		// Mock the apply_filters( 'jetpack_disconnect_cap', ) call in jetpack_connection_custom_caps.
		$this->mock_function( 'apply_filters', array( 'manage_options' ) );

		$caps = $this->manager->jetpack_connection_custom_caps( self::DEFAULT_TEST_CAPS, $custom_cap, 1, array() );
		$this->assertEquals( $expected_caps, $caps );
		$this->apply_filters_deprecated->disable();
	}

	/**
	 * Data provider test_jetpack_connection_custom_caps.
	 *
	 * Structure of the test data arrays:
	 *     [0] => 'in_offline_mode'   boolean Whether offline mode is active.
	 *     [1] => 'custom_cap'        string The custom capability that is being tested.
	 *     [2] => 'expected_caps'     array The expected output of the call to jetpack_connection_custom_caps.
	 */
	public function jetpack_connection_custom_caps_data_provider() {

		return array(
			'offline mode, jetpack_connect'          => array( true, 'jetpack_connect', array( 'do_not_allow' ) ),
			'offline mode, jetpack_reconnect'        => array( true, 'jetpack_reconnect', array( 'do_not_allow' ) ),
			'offline mode, jetpack_disconnect'       => array( true, 'jetpack_disconnect', array( 'manage_options' ) ),
			'offline mode, jetpack_connect_user'     => array( true, 'jetpack_connect_user', array( 'do_not_allow' ) ),
			'offline mode, unknown cap'              => array( true, 'unknown_cap', self::DEFAULT_TEST_CAPS ),
			'not offline mode, jetpack_connect'      => array( false, 'jetpack_connect', array( 'manage_options' ) ),
			'not offline mode, jetpack_reconnect'    => array( false, 'jetpack_reconnect', array( 'manage_options' ) ),
			'not offline mode, jetpack_disconnect'   => array( false, 'jetpack_disconnect', array( 'manage_options' ) ),
			'not offline mode, jetpack_connect_user' => array( false, 'jetpack_connect_user', array( 'read' ) ),
			'not offline mode, unknown cap'          => array( false, 'unknown_cap', self::DEFAULT_TEST_CAPS ),
		);
	}

	/**
	 * Test the `is_registered' method.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_registered
	 * @dataProvider is_registered_data_provider
	 *
	 * @param object|boolean $blog_token The blog token. False if the blog token does not exist.
	 * @param int|boolean    $blog_id The blog id. False if the blog id does not exist.
	 * @param boolean        $expected_output The expected output.
	 */
	public function test_is_registered( $blog_token, $blog_id, $expected_output ) {
		$this->manager->expects( $this->once() )
			->method( 'get_access_token' )
			->will( $this->returnValue( $blog_token ) );

		if ( $blog_id ) {
			update_option( 'jetpack_options', array( 'id' => $blog_id ) );
		} else {
			update_option( 'jetpack_options', array() );
		}

		$this->assertEquals( $expected_output, $this->manager->is_registered() );
	}

	/**
	 * Data provider for test_is_registered.
	 *
	 * Structure of the test data arrays:
	 *     [0] => 'blog_token'      object|boolean The blog token or false if the blog token does not exist.
	 *     [1] => 'blog_id'         int|boolean The blog id or false if the blog id does not exist.
	 *     [2] => 'expected_output' boolean The expected output of the call to is_registered.
	 */
	public function is_registered_data_provider() {
		$access_token = (object) array(
			'secret'           => 'abcd1234',
			'external_user_id' => 1,
		);

		return array(
			'blog token, blog id'       => array( $access_token, 1234, true ),
			'blog token, no blog id'    => array( $access_token, false, false ),
			'no blog token, blog id'    => array( false, 1234, false ),
			'no blog token, no blog id' => array( false, false, false ),
		);
	}

	/**
	 * Mock a global function and make it return a certain value.
	 *
	 * @param string $function_name Name of the function.
	 * @param mixed  $return_value Return value of the function.
	 * @param string $namespace The namespace of the function.
	 *
	 * @return Mock The mock object.
	 * @throws MockEnabledException PHPUnit wasn't able to enable mock functions.
	 */
	protected function mock_function( $function_name, $return_value = null, $namespace = __NAMESPACE__ ) {
		$builder = new MockBuilder();
		$builder->setNamespace( $namespace )
			->setName( $function_name )
			->setFunction(
				function() use ( &$return_value ) {
					return $return_value;
				}
			);

		$mock = $builder->build();
		$mock->enable();

		return $mock;
	}

	/**
	 * Filter to set the default constant values.
	 *
	 * @param string $value Existing value (empty and ignored).
	 * @param string $name Constant name.
	 *
	 * @see Utils::DEFAULT_JETPACK__API_BASE
	 * @see Utils::DEFAULT_JETPACK__API_VERSION
	 *
	 * @return string
	 */
	public function filter_api_constant( $value, $name ) {
		return constant( __NAMESPACE__ . "\Utils::DEFAULT_$name" );
	}

}
