<?php
require dirname( __FILE__ ) . '/../../../../modules/verification-tools/verification-tools-utils.php';

class WP_Test_Jetpack_Verification_Tools_Utils extends WP_UnitTestCase {

	/**
	 * @author zinigor
	 * @covers jetpack_verification_validate
	 * @since 5.5.0
	 */
	public function test_jetpack_verification_validate_processes_and_returns_codes() {
		$codes = array(
			'google' => '         untrimmed code      ',
			'bing' => 'some code that is going to be longer than 100 chars in order to test the trimming'
			. ' some code that isgoing to be longer than 100 chars in order to test the trimming'
			. ' some code that isgoing to be longer than 100 chars in order to test the trimming',
			'yandex' => 'some regular string with nothing special in it'
		);

		$processed_codes = jetpack_verification_validate( $codes );

		foreach( [ 'google', 'bing', 'yandex' ] as $key ) {
			$this->assertEquals(
				substr( esc_attr( trim( $codes[ $key ] ) ), 0, 100 ),
				$processed_codes[ $key ],
				'the code should be processed'
			);
		}
	}
}
