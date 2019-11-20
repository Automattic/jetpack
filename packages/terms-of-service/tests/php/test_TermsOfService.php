<?php

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;
use phpmock\Mock;
use phpmock\MockBuilder;

class Test_Terms_Of_Service extends TestCase {

	/**
	 * Test setup.
	 */
	public function setUp() {
		$this->terms_of_service = $this->createPartialMock( __NAMESPACE__ .'\\Terms_Of_Service',
			[ 'get_raw_has_agreed', 'is_development_mode', 'set_agree', 'is_active', 'set_reject' ]
		);
	}

	/**
	 * Test teardown.
	 */
	public function tearDown() {
		Mock::disableAll();
	}

	/**
	 * @covers Automattic\Jetpack\Terms_Of_Service->agree
	 */
	public function test_agree() {
		$this->mock_function( 'do_action', null,  'jetpack_agreed_to_terms_of_service' );
		$this->terms_of_service->expects( $this->once() )->method( 'set_agree' );

		$this->terms_of_service->agree();
	}

	/**
	 * @covers Automattic\Jetpack\Terms_Of_Service->revoke
	 */
	public function test_revoke() {
		$this->mock_function( 'do_action', null, 'jetpack_reject_terms_of_service' );
		$this->terms_of_service->expects( $this->once() )->method( 'set_reject' );

		$this->terms_of_service->reject();
	}

	/**
	 * @covers Automattic\Jetpack\Terms_Of_Service->has_agreed
	 */
	public function test_returns_false_if_not_agreed() {
		$this->terms_of_service->expects( $this->once() )->method( 'get_raw_has_agreed' )->willReturn( false );
		$this->assertFalse( $this->terms_of_service->has_agreed() );
	}

	/**
	 * @covers Automattic\Jetpack\Terms_Of_Service->has_agreed
	 */
	public function test_returns_false_if_has_agreed_but_is_development_mode() {
		// is_development_mode
		$this->terms_of_service->method( 'get_raw_has_agreed' )->willReturn( true );
		$this->terms_of_service->expects( $this->once() )->method( 'is_development_mode' )->willReturn( true );
		$this->assertFalse( $this->terms_of_service->has_agreed() );
	}

	/**
	 * @covers Automattic\Jetpack\Terms_Of_Service->has_agreed
	 */
	public function test_returns_true_if_active_even_if_not_agreed() {
		$this->terms_of_service->expects( $this->once() )->method( 'get_raw_has_agreed' )->willReturn( false );
		$this->terms_of_service->expects( $this->once() )->method( 'is_development_mode' )->willReturn( false );

		// Jetpack is active
		$this->terms_of_service->expects( $this->once() )->method( 'is_active' )->willReturn( true );

		$this->assertTrue( $this->terms_of_service->has_agreed() );
	}

	/**
	 * Mock a global function and make it return a certain value.
	 *
	 * @param string $function_name Name of the function.
	 * @param mixed  $return_value  Return value of the function.
	 * @return phpmock\Mock The mock object.
	 */
	protected function mock_function( $function_name, $return_value = null, $called_with = null ) {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
				->setName( $function_name )
				->setFunction( function( $VALUE ) use ( &$return_value, $called_with ) {
					if ( $called_with ) {
						$this->assertEquals( $VALUE, $called_with );
					}
					return $return_value;
				} );
		return $builder->build()->enable();
	}
}
