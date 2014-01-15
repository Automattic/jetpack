<?php

class WP_Test_Jetpack_PostImages extends WP_UnitTestCase {

	/**
	 * @author blobaugh
	 * @covers Jetpack_PostImages::from_html
	 * @since 2.7
	 */
	public function test_from_html_single_quotes() {
		$s = '<imgANYTHINGATALLHEREsrc="bob.jpg"MOREANYTHINGHERE/>';

		$result = Jetpack_PostImages::from_html( $s );
		
		$this->assertInternalType( 'array', $result );
		$this->assertFalse( empty( $result ) );
	}
	
	/**
	 * @author blobaugh
	 * @covers Jetpack_PostImages::from_html
	 * @since 2.7
	 */
	public function test_from_html_double_quotes() {
		$s = "<imgANYTHINGATALLHEREsrc='bob.jpg'MOREANYTHINGHERE/>";

		$result = Jetpack_PostImages::from_html( $s );

		
		$this->assertInternalType( 'array', $result );
		$this->assertFalse( empty( $result ) );
	}
} // end class
