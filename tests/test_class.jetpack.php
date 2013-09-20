<?php

class WP_Test_Jetpack extends WP_UnitTestCase {

	/**
	 * @author blobaugh
	 * @covers Jetpack::init
	 * @since 2.3.3
	 */
	public function test_init() {
		$this->assertInstanceOf( 'Jetpack', Jetpack::init() );
	}

	/**
	 * This is a pretty lame test, but it does show the expected output
	 * is an array.
	 * 
	 * @author blobaugh
	 * @covers Jetpack::catch_incompatible_modules
	 * @since 2.6
	 */
	public function test_catch_incompatible_modules() {
		$jp = Jetpack::init();

		$modules = array( 'one', 'two', 'three' );

		$this->assertInternalType( 'array', $jp->catch_incompatible_modules( $modules ) );
	}

} // end class