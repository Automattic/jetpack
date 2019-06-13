<?php

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;

class ManagerTest extends TestCase {
	public function setUp() {
		$this->manager = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
		                      ->setMethods( [ 'get_access_token' ] )
		                      ->getMock();
	}

	public function tearDown() {
		unset( $this->manager );
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
}
