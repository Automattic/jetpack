<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\Abtest;
use PHPUnit\Framework\TestCase;
use phpmock\Mock;
use phpmock\MockBuilder;

class Test_Abtest extends TestCase {
	/**
	 * Test setup.
	 */
	public function setUp() {
		$this->abtest = $this->getMockBuilder( 'Automattic\\Jetpack\\Abtest' )
					 ->setMethods( [ 'request_variation' ] )
					 ->getMock();

		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( 'is_wp_error' )
			->setFunction( function( $object ) {
				return is_a( $object, __NAMESPACE__ . '\\Error' );
			} );
		$mock = $builder->build();
		$mock->enable();
	}

	/**
	 * Test teardown.
	 */
	public function tearDown() {
		Mock::disableAll();
	}

	/**
	 * @covers Automattic\Jetpack\Abtest::get_variation
	 */
	public function test_with_no_test_name_provided() {
		$result = $this->abtest->get_variation( null );
		$this->assertNull( $result );
	}

	/**
	 * @covers Automattic\Jetpack\Abtest::get_variation
	 */
	public function test_with_incorrect_test_name_provided() {
		$result = $this->abtest->get_variation( 'example-test' );
		$this->assertNull( $result );
	}

	/**
	 * @covers Automattic\Jetpack\Abtest::get_variation
	 */
	public function test_when_test_inactive_or_does_not_exist() {
		$this->abtest->expects( $this->once() )
			 ->method( 'request_variation' )
			 ->willReturn( [
				'body' => json_encode( [
					'code'    => 'incorrect_test_name',
					'message' => 'This A/B test does not exist or is currently inactive.',
				] ),
			] );

		$result = $this->abtest->get_variation( 'example_test' );
		$this->assertNull( $result );
	}

	/**
	 * @covers Automattic\Jetpack\Abtest::get_variation
	 */
	public function test_when_error_or_malformed_response() {
		$this->abtest->expects( $this->once() )
			 ->method( 'request_variation' )
			 ->willReturn( [
				'status' => 500,
			] );

		$result = $this->abtest->get_variation( 'some_test' );
		$this->assertNull( $result );
	}

	/**
	 * @covers Automattic\Jetpack\Abtest::get_variation
	 */
	public function test_when_response_in_unexpected_format() {
		$this->abtest->expects( $this->once() )
			 ->method( 'request_variation' )
			 ->willReturn( [
				'body' => json_encode( [
					'foo' => 'bar',
				] ),
			] );

		$result = $this->abtest->get_variation( 'some_test' );
		$this->assertNull( $result );
	}

	/**
	 * @covers Automattic\Jetpack\Abtest::get_variation
	 */
	public function test_with_valid_active_test() {
		$variation = 'original';
		$this->abtest->expects( $this->once() )
			 ->method( 'request_variation' )
			 ->willReturn( [
				'body' => json_encode( [
					'variation' => $variation,
				] ),
			] );

		$result = $this->abtest->get_variation( 'some_test' );
		$this->assertEquals( $variation, $result );

		// Try again to verify we're caching the value instead of requesting it with `request_variation()` again.
		$result = $this->abtest->get_variation( 'some_test' );
		$this->assertEquals( $variation, $result );
	}
}

/**
 * We're declaring this class to mock Automattic\Jetpack\Error in the tests.
 */
class Error {

}
