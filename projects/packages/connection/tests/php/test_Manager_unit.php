<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Connection Manager functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;
use WorDBless\Users as WorDBless_Users;
use WP_Error;

/**
 * Connection Manager functionality testing.
 */
class ManagerTest extends TestCase {

	/**
	 * Temporary stack for `wp_redirect`.
	 *
	 * @var array
	 */
	protected $arguments_stack = array();

	/**
	 * User ID added for the test.
	 *
	 * @var int
	 */
	protected $user_id;

	const DEFAULT_TEST_CAPS = array( 'default_test_caps' );

	/**
	 * Initialize the object before running the test method.
	 *
	 * @before
	 */
	public function set_up() {
		$this->manager = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->setMethods( array( 'get_tokens', 'get_connection_owner_id' ) )
			->getMock();

		$this->tokens = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Tokens' )
			->setMethods( array( 'get_access_token' ) )
			->getMock();

		$this->manager->method( 'get_tokens' )->will( $this->returnValue( $this->tokens ) );

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'test_is_user_connected_with_user_id_logged_in',
				'user_pass'  => '123',
			)
		);
		wp_set_current_user( 0 );
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
		unset( $this->manager );
		unset( $this->tokens );
		Constants::clear_constants();
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
		$this->tokens->expects( $this->once() )
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
		$this->tokens->expects( $this->once() )
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

		$overwrite_filter = function () {
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
		$this->assertFalse( $this->manager->is_user_connected() );
	}

	/**
	 * Test the `is_user_connected` functionality.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_user_connected
	 */
	public function test_is_user_connected_with_false_user_id_logged_out() {
		$this->assertFalse( $this->manager->is_user_connected( false ) );
	}

	/**
	 * Test the `is_user_connected` functionality
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_user_connected
	 */
	public function test_is_user_connected_with_user_id_logged_out_not_connected() {
		$this->tokens->expects( $this->once() )
			->method( 'get_access_token' )
			->will( $this->returnValue( false ) );

		$this->assertFalse( $this->manager->is_user_connected( $this->user_id ) );
	}

	/**
	 * Test the `is_user_connected` functionality.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_user_connected
	 */
	public function test_is_user_connected_with_default_user_id_logged_in() {
		wp_set_current_user( $this->user_id );

		$access_token = (object) array(
			'secret'           => 'abcd1234',
			'external_user_id' => 1,
		);
		$this->tokens->expects( $this->once() )
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
		$access_token = (object) array(
			'secret'           => 'abcd1234',
			'external_user_id' => 1,
		);
		$this->tokens->expects( $this->once() )
			->method( 'get_access_token' )
			->will( $this->returnValue( $access_token ) );

		$this->assertTrue( $this->manager->is_user_connected( $this->user_id ) );
	}

	/**
	 * Unit test for the "Delete all tokens" functionality.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::delete_all_connection_tokens
	 */
	public function test_delete_all_connection_tokens() {
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
	 */
	public function test_disconnect_site_wpcom() {
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
	 * @param bool   $owner_exists Whether a connection owner exists.
	 * @param string $custom_cap The custom capability that is being tested.
	 * @param array  $expected_caps The expected output.
	 */
	public function test_jetpack_connection_custom_caps( $in_offline_mode, $owner_exists, $custom_cap, $expected_caps ) {
		// Mock the apply_filters( 'jetpack_offline_mode', ) call in Status::is_offline_mode.
		add_filter(
			'jetpack_offline_mode',
			function () use ( $in_offline_mode ) {
				return $in_offline_mode;
			}
		);

		$this->manager->method( 'get_connection_owner_id' )
			->withAnyParameters()
			->willReturn( $owner_exists ); // 0 or 1 is alright for our testing purposes.

		$caps = $this->manager->jetpack_connection_custom_caps( self::DEFAULT_TEST_CAPS, $custom_cap, 1, array() );
		$this->assertEquals( $expected_caps, $caps );
	}

	/**
	 * Data provider test_jetpack_connection_custom_caps.
	 *
	 * Structure of the test data arrays:
	 *     [0] => 'in_offline_mode'   boolean Whether offline mode is active.
	 *     [1] => 'owner_exists'      boolean Whether a connection owner exists.
	 *     [2] => 'custom_cap'        string The custom capability that is being tested.
	 *     [3] => 'expected_caps'     array The expected output of the call to jetpack_connection_custom_caps.
	 */
	public function jetpack_connection_custom_caps_data_provider() {

		return array(
			'offline mode, owner exists, jetpack_connect'  => array( true, true, 'jetpack_connect', array( 'do_not_allow' ) ),
			'offline mode, owner exists, jetpack_reconnect' => array( true, true, 'jetpack_reconnect', array( 'do_not_allow' ) ),
			'offline mode, owner exists, jetpack_disconnect' => array( true, true, 'jetpack_disconnect', array( 'manage_options' ) ),
			'offline mode, owner exists, jetpack_connect_user' => array( true, true, 'jetpack_connect_user', array( 'do_not_allow' ) ),
			'offline mode, no owner, jetpack_connect_user' => array( true, false, 'jetpack_connect_user', array( 'do_not_allow' ) ),
			'offline mode, owner exists, unknown cap'      => array( true, true, 'unknown_cap', self::DEFAULT_TEST_CAPS ),
			'not offline mode, owner exists, jetpack_connect' => array( false, true, 'jetpack_connect', array( 'manage_options' ) ),
			'not offline mode, owner exists, jetpack_reconnect' => array( false, true, 'jetpack_reconnect', array( 'manage_options' ) ),
			'not offline mode, owner exists, jetpack_disconnect' => array( false, true, 'jetpack_disconnect', array( 'manage_options' ) ),
			'not offline mode, owner exists, jetpack_connect_user' => array( false, true, 'jetpack_connect_user', array( 'read' ) ),
			'not offline mode, no owner, jetpack_connect_user' => array( false, false, 'jetpack_connect_user', array( 'manage_options' ) ),
			'not offline mode, owner exists, unknown cap'  => array( false, true, 'unknown_cap', self::DEFAULT_TEST_CAPS ),
		);
	}

	/**
	 * Test the `get_signed_token` functionality.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::get_signed_token
	 */
	public function test_get_signed_token() {
		$access_token = (object) array(
			'external_user_id' => 1,
		);

		// Missing secret.
		$invalid_token_error = new WP_Error( 'invalid_token' );
		$this->assertEquals( $invalid_token_error, ( new Tokens() )->get_signed_token( $access_token ) );
		// Secret is null.
		$access_token->secret = null;
		$this->assertEquals( $invalid_token_error, ( new Tokens() )->get_signed_token( $access_token ) );
		// Secret is empty.
		$access_token->secret = '';
		$this->assertEquals( $invalid_token_error, ( new Tokens() )->get_signed_token( $access_token ) );
		// Valid secret.
		$access_token->secret = 'abcd.1234';

		$signed_token = ( new Tokens() )->get_signed_token( $access_token );
		$this->assertTrue( strpos( $signed_token, 'token' ) !== false );
		$this->assertTrue( strpos( $signed_token, 'timestamp' ) !== false );
		$this->assertTrue( strpos( $signed_token, 'nonce' ) !== false );
		$this->assertTrue( strpos( $signed_token, 'signature' ) !== false );
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
