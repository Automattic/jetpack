<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Secrets functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;

/**
 * Secrets functionality testing.
 */
class SecretsTest extends TestCase {

	/**
	 * Calls the private Secrets::secret_callable_method method
	 */
	public function call_private_secret_callable_method() {
		$method = new \ReflectionMethod( 'Automattic\Jetpack\Connection\Secrets', 'secret_callable_method' );
		$method->setAccessible( true );
		return $method->invoke( new Secrets() );
	}

	/**
	 * Asserts that secret_callable_method returns the correct string length
	 */
	public function assert_generate_secrets_length() {
		$secret = $this->call_private_secret_callable_method();
		return $this->assertSame( 32, strlen( $secret ) );
	}

	/**
	 * Cuts the string and returns only the first 16 characters
	 *
	 * @param string $string The string.
	 * @return string
	 */
	public function trim_string_to_16( $string ) {
		return substr( $string, 0, 16 );
	}

	/**
	 * Cuts the string and returns only the first 7 characters
	 *
	 * @param string $string The string.
	 * @return string
	 */
	public function trim_string_to_7( $string ) {
		return substr( $string, 0, 7 );
	}

	/**
	 * Cuts the string and returns only the first character
	 *
	 * @param string $string The string.
	 * @return string
	 */
	public function trim_string_to_1( $string ) {
		return substr( $string, 0, 1 );
	}

	/**
	 * Test secret_callable_method default behavior
	 */
	public function test_generate_secrets_length() {
		$secret = $this->call_private_secret_callable_method();
		$this->assertSame( 32, strlen( $secret ) );
	}

	/**
	 * Test secret_callable_method with filter 16
	 */
	public function test_generate_secrets_length_16() {
		add_filter( 'random_password', array( $this, 'trim_string_to_16' ) );
		$this->assert_generate_secrets_length();
		remove_filter( 'random_password', array( $this, 'trim_string_to_16' ) );
	}

	/**
	 * Test secret_callable_method with filter 7
	 */
	public function test_generate_secrets_length_7() {
		add_filter( 'random_password', array( $this, 'trim_string_to_7' ) );
		$this->assert_generate_secrets_length();
		remove_filter( 'random_password', array( $this, 'trim_string_to_7' ) );
	}

	/**
	 * Test secret_callable_method with filter 1
	 */
	public function test_generate_secrets_length_1() {
		add_filter( 'random_password', array( $this, 'trim_string_to_1' ) );
		$this->assert_generate_secrets_length();
		remove_filter( 'random_password', array( $this, 'trim_string_to_1' ) );
	}

	/**
	 * Test secret_callable_method with filter that returns an empty string
	 */
	public function test_generate_secrets_length_empty_string() {
		add_filter( 'random_password', '__return_empty_string' );
		$secret = $this->call_private_secret_callable_method();
		$this->assertSame( '', $secret ); // We are just assuring that we are not entering an infinite loop. In a situation like this, the site would be broken.
		remove_filter( 'random_password', '__return_empty_string' );
	}

}
