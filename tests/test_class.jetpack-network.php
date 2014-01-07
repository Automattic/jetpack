<?php

class WP_Test_Jetpack_Network extends WP_UnitTestCase {

    /**
     * @since 2.5
     */
    public function test_jetpack_network_init_returns_jetpack_network() {
		$this->assertInstanceOf( 'Jetpack_Network', Jetpack_Network::init() );
    }

    /**
     * @since 2.5
     */
    public function test_get_url_returns_string_on_valid_input() {
		$jpms = new Jetpack_Network::init();

		$this->assertInternalType( 'string', $jpms->get_url( 'network_admin_page' ) );
    }

    /**
     * since 2.5
     */
    public function test_get_url_returns_null_for_invalid_input() {
	    $jpms = new Jetpack_Network::init();

	    $this->assertNull( $jpms->get_url( 1234 );
    }

    /**
     * @since 2.5
     */
    public function test_list_modules_returns_array() {
		$jpms = Jetpack_Network::init();

		$this->assertInternalType( 'array', $jpms->list_modules() );
    }
} // end class
