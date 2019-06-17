<?php

namespace Automattic\Jetpack\Connection;

use phpmock\Mock;
use phpmock\MockBuilder;
use PHPUnit\Framework\TestCase;

class ManagerTest extends TestCase {
	public function setUp() {
		$this->manager = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
		                      ->setMethods( [ 'get_access_token' ] )
		                      ->getMock();
	}

	public function tearDown() {
		unset( $this->manager );
		Mock::disableAll();
	}

	function test_class_implements_interface() {
		$manager = new Manager();
		$this->assertInstanceOf( 'Automattic\Jetpack\Connection\Manager_Interface', $manager );
	}

	/**
	 * @covers Automattic\Jetpack\Connection\Manager::is_active
	 */
	public function test_is_active_when_connected() {
		$access_token = (object) [
			'secret'           => 'abcd1234',
			'external_user_id' => 1,
		];
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
		$access_token = (object) [
			'secret'           => 'abcd1234',
			'external_user_id' => 1,
		];
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
		$access_token = (object) [
			'secret'           => 'abcd1234',
			'external_user_id' => 1,
		];
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
			->setFunction( function() use ( &$return_value ) {
				return $return_value;
			} );
		return $builder->build()->enable();
	}
}
