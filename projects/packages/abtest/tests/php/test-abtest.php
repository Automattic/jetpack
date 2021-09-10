<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests the AB Test package.
 *
 * @package automattic/jetpack-abtest
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;

/**
 * Class Test_Abtest
 *
 * @package Automattic\Jetpack
 */
class Test_Abtest extends TestCase {
	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		$this->abtest = $this->getMockBuilder( 'Automattic\\Jetpack\\Abtest' )
								->setMethods( array( 'request_variation' ) )
								->getMock();
	}

	/**
	 * Tests with no test name provided.
	 *
	 * @covers Automattic\Jetpack\Abtest
	 */
	public function test_with_no_test_name_provided() {
		$result = $this->abtest->get_variation( null );
		$this->assertNull( $result );
	}

	/**
	 * Tests when incorrect test name is provided.
	 *
	 * @covers Automattic\Jetpack\Abtest
	 */
	public function test_with_incorrect_test_name_provided() {
		$result = $this->abtest->get_variation( 'example-test' );
		$this->assertNull( $result );
	}

	/**
	 * Tests when a test is inactive or does not exist.
	 *
	 * @covers Automattic\Jetpack\Abtest
	 */
	public function test_when_test_inactive_or_does_not_exist() {
		$this->abtest->expects( $this->once() )
						->method( 'request_variation' )
						->willReturn(
							array(
								'body' => json_encode( // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
									array(
										'code'    => 'incorrect_test_name',
										'message' => 'This A/B test does not exist or is currently inactive.',
									)
								),
							)
						);

		$result = $this->abtest->get_variation( 'example_test' );
		$this->assertNull( $result );
	}

	/**
	 * Tests an error or malformed response.
	 *
	 * @covers Automattic\Jetpack\Abtest
	 */
	public function test_when_error_or_malformed_response() {
		$this->abtest->expects( $this->once() )
						->method( 'request_variation' )
						->willReturn(
							array(
								'status' => 500,
							)
						);

		$result = $this->abtest->get_variation( 'some_test' );
		$this->assertNull( $result );
	}

	/**
	 * Tests when the response is in an unexpected format.
	 *
	 * @covers Automattic\Jetpack\Abtest
	 */
	public function test_when_response_in_unexpected_format() {
		$this->abtest->expects( $this->once() )
						->method( 'request_variation' )
						->willReturn(
							array(
								'body' => json_encode( // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
									array(
										'foo' => 'bar',
									)
								),
							)
						);

		$result = $this->abtest->get_variation( 'some_test' );
		$this->assertNull( $result );
	}

	/**
	 * Test with an active test.
	 *
	 * @covers Automattic\Jetpack\Abtest
	 */
	public function test_with_valid_active_test() {
		$variation = 'original';
		$this->abtest->expects( $this->once() )
						->method( 'request_variation' )
						->willReturn(
							array(
								'body' => json_encode( // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
									array(
										'variation' => $variation,
									)
								),
							)
						);

		$result = $this->abtest->get_variation( 'some_test' );
		$this->assertEquals( $variation, $result );

		// Try again to verify we're caching the value instead of requesting it with `request_variation()` again.
		$result = $this->abtest->get_variation( 'some_test' );
		$this->assertEquals( $variation, $result );
	}
}
