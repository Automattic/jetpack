<?php

class WP_Test_Jetpack extends WP_UnitTestCase {

	/**
	 * @since 2.3.3
	 */
	public function test_init() {
		$this->assertInstanceOf( 'Jetpack', Jetpack::init() );
	}

} // end class