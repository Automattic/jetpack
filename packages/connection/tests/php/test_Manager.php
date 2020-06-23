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

		$this->apply_filters = $builder->build();

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
		$this->constants_apply_filters->enable();

		$this->assertEquals(
			'https://jetpack.wordpress.com/jetpack.something/1/',
			$this->manager->api_url( 'something' )
		);
		$this->assertEquals(
			'https://jetpack.wordpress.com/jetpack.another_thing/1/',
			$this->manager->api_url( 'another_thing/' )
		);
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

		// Getting a new special mock just for this occasion.
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
				->setName( 'apply_filters' )
				->setFunction(
					// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
					function( $filter_name, $return_value ) {
						$this->arguments_stack[ $filter_name ] [] = func_get_args();
						return 'completely overwrite';
					}
				);

		$builder->build()->enable();

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
	 * Mock a global function and make it return a certain value.
	 *
	 * @param string $function_name Name of the function.
	 * @param mixed  $return_value Return value of the function.
	 *
	 * @return Mock The mock object.
	 * @throws MockEnabledException PHPUnit wasn't able to enable mock functions.
	 */
	protected function mock_function( $function_name, $return_value = null ) {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
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

}
