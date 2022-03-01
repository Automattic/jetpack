<?php
require __DIR__ . '/../../../../modules/verification-tools/verification-tools-utils.php';

class WP_Test_Jetpack_Verification_Tools_Utils extends WP_UnitTestCase {

	/**
	 * @author cbauerman
	 * @covers ::jetpack_verification_validate
	 * @since 6.5.0
	 */
	public function test_jetpack_verification_validate_google_raw_code() {
		$this->assertEquals(
			jetpack_verification_validate( array( 'google' => 'W2gxpExLATRT5c0dgRjlJsXRnrLE7vpr_1YtYxEnDIzn9ylj7C' ) ),
			array( 'google' => 'W2gxpExLATRT5c0dgRjlJsXRnrLE7vpr_1YtYxEnDIzn9ylj7C' ),
			'raw code should be accepeted'
		);
	}

	/**
	 * @author cbauerman
	 * @covers ::jetpack_verification_validate
	 * @since 6.5.0
	 */
	public function test_jetpack_verification_validate_google_code_in_meta_double_quotes() {
		$this->assertEquals(
			jetpack_verification_validate( array( 'test' => '<meta name="google-site-verification" content="bX1szG_kxD6O0CGSVgS8m4F5gKvgUPMdo96McTiJ7pZ5Ax7mQr" />' ) ),
			array( 'test' => 'bX1szG_kxD6O0CGSVgS8m4F5gKvgUPMdo96McTiJ7pZ5Ax7mQr' ),
			'google-style meta tag with double quotes should be accepeted'
		);
	}

	/**
	 * @author cbauerman
	 * @covers ::jetpack_verification_validate
	 * @since 6.5.0
	 */
	public function test_jetpack_verification_validate_google_code_in_meta_single_quotes() {
		$this->assertEquals(
			jetpack_verification_validate( array( 'test' => '<meta name="google-site-verification" content=\'jLjbTBvtuQepL3eR09id83p4q_w8JBStrB5DKCunOX7kK1XKub\' />' ) ),
			array( 'test' => 'jLjbTBvtuQepL3eR09id83p4q_w8JBStrB5DKCunOX7kK1XKub' ),
			'google-style meta tag with single quotes should be accepeted'
		);
	}
}
