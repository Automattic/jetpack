<?php
/**
 * Unit Tests for Automattic\Jetpack\JWT class.
 *
 * To run the test visit the packages/jwt directory and run composer test-php
 *
 * @package automattic/jetpack-jwt
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;

class Jwt_Test extends TestCase {

	/**
	 * Test that the JWT class can be instantiated.
	 */
	public function test_jwt_class_can_be_instantiated() {
		$jwt = new JWT();
		$this->assertInstanceOf( 'Automattic\Jetpack\JWT', $jwt );
		$this->assertTrue( method_exists( $jwt, 'encode' ) );
		$this->assertTrue( method_exists( $jwt, 'decode' ) );
	}

	/**
	 * Test that the JWT class has a method to encode a token.
	 */
	public function test_jwt_encode_decode() {
		$secret  = '1234567890abcdef1234567890abcdef'; // Example secret key
		$payload = array(
			'howdy' => 'world',
			'iss'   => 'https://example.com',
			'sub'   => '1234567890',
		);
		$jwt     = JWT::encode( $payload, $secret, 'HS256' );
		$decoded = JWT::decode( $jwt, $secret, array( 'HS256' ) );

		$this->assertNotEmpty( $jwt );
		$this->assertIsString( $jwt );
		$this->assertIsObject( $decoded );
		$this->assertEquals( $payload['howdy'], $decoded->howdy );
		$this->assertEquals( $payload['iss'], $decoded->iss );
		$this->assertEquals( $payload['sub'], $decoded->sub );
	}
	/**
	 * Test that the JWT class has a method to encode a token.
	 */
	public function test_jwt_encode_decode_array() {
		$secret  = '1234567890abcdef1234567890abcdef'; // Example secret key
		$payload = array(
			'howdy' => 'world',
			'iss'   => 'https://example.com',
			'sub'   => '1234567890',
		);
		$jwt     = JWT::encode( $payload, $secret, 'HS256' );
		$decoded = JWT::decode( $jwt, $secret, array( 'HS256' ), true );

		$this->assertNotEmpty( $jwt );
		$this->assertIsString( $jwt );
		$this->assertIsArray( $decoded );
		$this->assertEquals( $payload['howdy'], $decoded['howdy'] );
		$this->assertEquals( $payload['iss'], $decoded['iss'] );
		$this->assertEquals( $payload['sub'], $decoded['sub'] );
	}

	/**
	 * Test that the JWT class has a method to encode a token.
	 */
	public function test_jwt_encode_decode_json() {

		$payload = array(
			'howdy' => 'world',
			'iss'   => 'https://example.com',
			'sub'   => '1234567890',
		);
		$jwt     = JWT::json_encode( $payload );
		$decoded = JWT::json_decode( $jwt );

		$this->assertNotEmpty( $jwt );
		$this->assertIsString( $jwt );
		$this->assertIsObject( $decoded );
		$this->assertEquals( $payload['howdy'], $decoded->howdy );
		$this->assertEquals( $payload['iss'], $decoded->iss );
		$this->assertEquals( $payload['sub'], $decoded->sub );
	}

	/**
	 * Test JWT encoding with different algorithms.
	 */
	public function test_jwt_encode_with_different_algorithms() {
		$secret  = '1234567890abcdef1234567890abcdef';
		$payload = array(
			'user_id' => 123,
			'exp'     => time() + 3600,
		);

		$algorithms = array( 'HS256', 'HS384', 'HS512' );

		foreach ( $algorithms as $algorithm ) {
			$jwt = JWT::encode( $payload, $secret, $algorithm );
			$this->assertNotEmpty( $jwt );
			$this->assertIsString( $jwt );

			$decoded = JWT::decode( $jwt, $secret, array( $algorithm ) );
			$this->assertEquals( $payload['user_id'], $decoded->user_id );
		}
	}

	/**
	 * Test JWT with expiration time.
	 */
	public function test_jwt_with_expiration() {
		$secret  = '1234567890abcdef1234567890abcdef';
		$payload = array(
			'user_id' => 123,
			'exp'     => time() + 3600, // Expires in 1 hour
			'iat'     => time(),
		);

		$jwt     = JWT::encode( $payload, $secret, 'HS256' );
		$decoded = JWT::decode( $jwt, $secret, array( 'HS256' ) );

		$this->assertEquals( $payload['user_id'], $decoded->user_id );
		$this->assertEquals( $payload['exp'], $decoded->exp );
		$this->assertEquals( $payload['iat'], $decoded->iat );
	}

	/**
	 * Test JWT decode with invalid secret.
	 */
	public function test_jwt_decode_with_invalid_secret() {
		$this->expectException( \Exception::class );

		$secret  = '1234567890abcdef1234567890abcdef';
		$payload = array( 'user_id' => 123 );
		$jwt     = JWT::encode( $payload, $secret, 'HS256' );

		// Try to decode with wrong secret
		JWT::decode( $jwt, 'wrongsecret', array( 'HS256' ) );
	}

	/**
	 * Test JWT decode with malformed token.
	 */
	public function test_jwt_decode_with_malformed_token() {
		$this->expectException( \Exception::class );

		$secret = '1234567890abcdef1234567890abcdef';
		JWT::decode( 'invalid.jwt.token', $secret, array( 'HS256' ) );
	}

	/**
	 * Test JWT with empty payload.
	 */
	public function test_jwt_with_empty_payload() {
		$secret  = '1234567890abcdef1234567890abcdef';
		$payload = (object) array();

		$jwt     = JWT::encode( $payload, $secret, 'HS256' );
		$decoded = JWT::decode( $jwt, $secret, array( 'HS256' ) );

		$this->assertNotEmpty( $jwt );
		$this->assertIsObject( $decoded );
	}

	/**
	 * Test JWT with null values in payload.
	 */
	public function test_jwt_with_null_values() {
		$secret  = '1234567890abcdef1234567890abcdef';
		$payload = array(
			'user_id' => null,
			'name'    => 'test',
			'data'    => null,
		);

		$jwt     = JWT::encode( $payload, $secret, 'HS256' );
		$decoded = JWT::decode( $jwt, $secret, array( 'HS256' ) );

		$this->assertNull( $decoded->user_id );
		$this->assertEquals( 'test', $decoded->name );
		$this->assertNull( $decoded->data );
	}
}
