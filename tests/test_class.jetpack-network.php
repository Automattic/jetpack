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
		$jpms = Jetpack_Network::init();

		$this->assertInternalType( 'string', $jpms->get_url( 'network_admin_page' ) );
    }

    /**
     * since 2.5
     */
    public function test_get_url_returns_null_for_invalid_input() {
	    $jpms = Jetpack_Network::init();

	    $this->assertNull( $jpms->get_url( 1234 ) );
    }

    /**
     * @since 2.8
     **/
    public function test_set_auto_activated_modules_returns_array() {
		$jpms = Jetpack_Network::init();

		$this->assertInternalType( 'array', $jpms->set_auto_activated_modules( array() ) );
    }

    /**
     * @since 2.8
     **/
    public function test_add_jetpack_sites_column_adds_column() {
		$jpms = Jetpack_Network::init();

		$columns = $jpms->add_jetpack_sites_column( array() );

		$this->assertTrue( isset( $columns['jetpack_connection'] ) );
    }

    /**
     * @since 2.8
     **/
    public function test_body_class_contains_network_admin() {
		$jpms = Jetpack_Network::init();

		$classes = $jpms->body_class( array() );

		$this->assertTrue( in_array( 'network-admin', $classes ) );
    }


} // end class
