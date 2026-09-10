<?php

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
require __DIR__ . '/../../../../modules/verification-tools/verification-tools-utils.php';

/**
 * @covers ::jetpack_verification_validate
 * @covers ::jetpack_verification_validate_code
 */
#[CoversFunction( 'jetpack_verification_validate' )]
#[CoversFunction( 'jetpack_verification_validate_code' )]
class Jetpack_Verification_Tools_Utils_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @author cbauerman
	 * @since 6.5.0
	 */
	public function test_jetpack_verification_validate_google_raw_code() {
		$this->assertEquals(
			array( 'google' => '+nxGUDJ4QpAZ5l9Bsjdi102tLVC21AIh5d1Nl23908vVuFHs34=' ),
			jetpack_verification_validate( array( 'google' => '+nxGUDJ4QpAZ5l9Bsjdi102tLVC21AIh5d1Nl23908vVuFHs34=' ) ),
			'raw code should be accepted'
		);
	}

	/**
	 * @author cbauerman
	 * @since 6.5.0
	 */
	public function test_jetpack_verification_validate_google_code_in_meta_double_quotes() {
		$this->assertEquals(
			array( 'test' => '+nxGUDJ4QpAZ5l9Bsjdi102tLVC21AIh5d1Nl23908vVuFHs34=' ),
			jetpack_verification_validate( array( 'test' => '<meta name="google-site-verification" content="+nxGUDJ4QpAZ5l9Bsjdi102tLVC21AIh5d1Nl23908vVuFHs34=" />' ) ),
			'google-style meta tag with double quotes should be accepeted'
		);
	}

	/**
	 * @author cbauerman
	 * @since 6.5.0
	 */
	public function test_jetpack_verification_validate_google_code_in_meta_single_quotes() {
		$this->assertEquals(
			array( 'test' => 'jLjbTBvtuQepL3eR09id83p4q_w8JBStrB5DKCunOX7kK1XKub' ),
			jetpack_verification_validate( array( 'test' => '<meta name="google-site-verification" content=\'jLjbTBvtuQepL3eR09id83p4q_w8JBStrB5DKCunOX7kK1XKub\' />' ) ),
			'google-style meta tag with single quotes should be accepeted'
		);
	}

	/**
	 * Verification codes with valid characters are accepted for every service.
	 *
	 * @dataProvider valid_verification_code_provider
	 *
	 * @param string $service Verification service key.
	 * @param string $code    Verification code.
	 */
	#[DataProvider( 'valid_verification_code_provider' )]
	public function test_valid_code_is_accepted_for_every_service( $service, $code ) {
		$this->assertSame(
			array( $service => $code ),
			jetpack_verification_validate( array( $service => $code ) )
		);
	}

	/**
	 * Verification codes with invalid characters are rejected for every service.
	 *
	 * @dataProvider invalid_verification_code_provider
	 *
	 * @param string $service Verification service key.
	 * @param string $code    Verification code.
	 */
	#[DataProvider( 'invalid_verification_code_provider' )]
	public function test_invalid_code_is_rejected_for_every_service( $service, $code ) {
		$this->assertSame(
			array( $service => '' ),
			jetpack_verification_validate( array( $service => $code ) )
		);
	}

	/**
	 * The validation action receives the same canonical code that is returned for storage.
	 */
	public function test_validation_action_receives_canonical_code() {
		$action_code = null;
		$callback    = static function ( $service, $code ) use ( &$action_code ) {
			$action_code = $code;
		};
		add_action( 'jetpack_site_verification_validate', $callback, 10, 2 );

		$validated = jetpack_verification_validate( array( 'google' => 'verification&Code' ) );

		remove_action( 'jetpack_site_verification_validate', $callback, 10 );
		$this->assertSame( $validated['google'], $action_code );
	}

	/**
	 * Provide valid verification codes.
	 *
	 * @return array<string, array{string, string}> Test cases.
	 */
	public static function valid_verification_code_provider() {
		return array(
			'google'           => array( 'google', '+nxGUDJ4QpAZ5l9Bsjdi102tLVC21AIh5d1Nl23908vVuFHs34=' ),
			'bing'             => array( 'bing', '12C1203B5086AECE94EB3A3D9830B2E' ),
			'pinterest'        => array( 'pinterest', 'f100679e6048d45e4a0b0b92dce1efce' ),
			'yandex'           => array( 'yandex', '44d68e1216009f40' ),
			'facebook'         => array( 'facebook', 'rvv8b23jxlp1lq41I9rwsvpzncy1fd' ),
			'safe punctuation' => array( 'google', 'verification.Code_123-+/=:@~' ),
			'ampersand'        => array( 'bing', 'verification&Code' ),
		);
	}

	/**
	 * Provide invalid verification codes.
	 *
	 * @return array<string, array{string, string}> Test cases.
	 */
	public static function invalid_verification_code_provider() {
		return array(
			'opening angle bracket'        => array( 'google', 'invalid<script' ),
			'closing angle bracket'        => array( 'bing', 'invalid>script' ),
			'double quote'                 => array( 'pinterest', 'invalid"code' ),
			'single quote'                 => array( 'yandex', "invalid'code" ),
			'control character'            => array( 'facebook', "invalid\ncode" ),
			'unsafe character after limit' => array( 'google', '<meta name="google-site-verification" content="' . str_repeat( 'a', 100 ) . '<" />' ),
		);
	}
}
