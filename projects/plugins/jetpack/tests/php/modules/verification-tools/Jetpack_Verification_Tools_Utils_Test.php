<?php

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
require __DIR__ . '/../../../../modules/verification-tools/verification-tools-utils.php';

/**
 * @covers ::jetpack_verification_validate
 */
#[CoversFunction( 'jetpack_verification_validate' )]
class Jetpack_Verification_Tools_Utils_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @author cbauerman
	 * @since 6.5.0
	 */
	public function test_jetpack_verification_validate_google_raw_code() {
		$this->assertEquals(
			array( 'google' => 'W2gxpExLATRT5c0dgRjlJsXRnrLE7vpr_1YtYxEnDIzn9ylj7C' ),
			jetpack_verification_validate( array( 'google' => 'W2gxpExLATRT5c0dgRjlJsXRnrLE7vpr_1YtYxEnDIzn9ylj7C' ) ),
			'raw code should be accepeted'
		);
	}

	/**
	 * @author cbauerman
	 * @since 6.5.0
	 */
	public function test_jetpack_verification_validate_google_code_in_meta_double_quotes() {
		$this->assertEquals(
			array( 'test' => 'bX1szG_kxD6O0CGSVgS8m4F5gKvgUPMdo96McTiJ7pZ5Ax7mQr' ),
			jetpack_verification_validate( array( 'test' => '<meta name="google-site-verification" content="bX1szG_kxD6O0CGSVgS8m4F5gKvgUPMdo96McTiJ7pZ5Ax7mQr" />' ) ),
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
	 * Verification codes with valid service-specific characters are accepted.
	 *
	 * @dataProvider valid_verification_code_provider
	 *
	 * @param string $service Verification service key.
	 * @param string $code    Verification code.
	 */
	#[DataProvider( 'valid_verification_code_provider' )]
	public function test_service_specific_valid_code_is_accepted( $service, $code ) {
		$this->assertSame(
			array( $service => $code ),
			jetpack_verification_validate( array( $service => $code ) )
		);
	}

	/**
	 * Verification codes with invalid service-specific characters are rejected.
	 *
	 * @dataProvider invalid_verification_code_provider
	 *
	 * @param string $service Verification service key.
	 * @param string $code    Verification code.
	 */
	#[DataProvider( 'invalid_verification_code_provider' )]
	public function test_service_specific_invalid_code_is_rejected( $service, $code ) {
		$this->assertSame(
			array( $service => '' ),
			jetpack_verification_validate( array( $service => $code ) )
		);
	}

	/**
	 * Provide valid verification codes.
	 *
	 * @return array<string, array{string, string}> Test cases.
	 */
	public static function valid_verification_code_provider() {
		return array(
			'google'    => array( 'google', 'dBw5CvburAxi537Rp9qi5uG2174Vb6JwHwIRwPSLIK8' ),
			'bing'      => array( 'bing', '12C1203B5086AECE94EB3A3D9830B2E' ),
			'pinterest' => array( 'pinterest', 'f100679e6048d45e4a0b0b92dce1efce' ),
			'yandex'    => array( 'yandex', '44d68e1216009f40' ),
			'facebook'  => array( 'facebook', 'rvv8b23jxlp1lq41I9rwsvpzncy1fd' ),
		);
	}

	/**
	 * Provide invalid verification codes.
	 *
	 * @return array<string, array{string, string}> Test cases.
	 */
	public static function invalid_verification_code_provider() {
		return array(
			'bing with non-hex characters'     => array( 'bing', 'not-a-bing-token' ),
			'pinterest with uppercase letters' => array( 'pinterest', 'ABCDEF123456' ),
			'yandex with non-hex characters'   => array( 'yandex', 'not-a-yandex-token' ),
			'google with spaces'               => array( 'google', 'not a google token' ),
			'facebook with punctuation'        => array( 'facebook', 'not.a.facebook.token' ),
		);
	}
}
