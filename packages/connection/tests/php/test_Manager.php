<?php

namespace Automattic\Jetpack\Connection;

use phpmock\Mock;
use phpmock\MockBuilder;
use PHPUnit\Framework\TestCase;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Connection\Utils;

class ManagerTest extends TestCase {

	protected $arguments_stack = array();

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
	}

	public function tearDown() {
		unset( $this->manager );
		Constants::clear_constants();
		Mock::disableAll();
	}

	/**
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
	 * @covers Automattic\Jetpack\Connection\Manager::is_active
	 */
	public function test_is_active_when_not_connected() {
		$this->manager->expects( $this->once() )
					  ->method( 'get_access_token' )
					  ->will( $this->returnValue( false ) );

		$this->assertFalse( $this->manager->is_active() );
	}

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
	 * @covers Automattic\Jetpack\Connection\Manager::is_user_connected
	 */
	public function test_is_user_connected_with_default_user_id_logged_out() {
		$this->mock_function( 'get_current_user_id', 0 );

		$this->assertFalse( $this->manager->is_user_connected() );
	}

	/**
	 * @covers Automattic\Jetpack\Connection\Manager::is_user_connected
	 */
	public function test_is_user_connected_with_false_user_id_logged_out() {
		$this->mock_function( 'get_current_user_id', 0 );

		$this->assertFalse( $this->manager->is_user_connected( false ) );
	}

	/**
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
	 * Mock a global function and make it return a certain value.
	 *
	 * @param string $function_name Name of the function.
	 * @param mixed  $return_value  Return value of the function.
	 * @return phpmock\Mock The mock object.
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
		return $builder->build()->enable();
	}
}
