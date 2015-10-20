<?php

class WP_Test_Jetpack_Network extends WP_UnitTestCase {

	/**
	 * @since 2.5
	 */
	public function test_jetpack_network_init_returns_jetpack_network() {
		$this->assertInstanceOf( 'Jetpack_Network', Jetpack_Network::init() );
	}

	/**
	 * @author enkrates
	 * @covers Jetpack_Network::get_url
	 * @since 3.2
	 */
	public function test_get_url_returns_correct_string_for_network_admin_page() {
		$jpms = Jetpack_Network::init();

		$url = $jpms->get_url( 'network_admin_page' );

		$expected_url = 'http://example.org/wp-admin/network/admin.php?page=jetpack';

		$this->assertInternalType( 'string', $url );
		$this->assertEquals( $expected_url, $url );
	}

	/**
	 * @author enkrates
	 * @covers Jetpack_Network::get_url
	 * @since 3.2
	 */
	public function test_get_url_returns_null_for_invalid_input() {
		$jpms = Jetpack_Network::init();

		$this->assertNull( $jpms->get_url( 1234 ) );
	}

	/**
	 * @author enkrates
	 * @covers Jetpack_Network::get_url
	 * @since 3.2
	 */
	public function test_get_url_returns_correct_string_for_subsiteregister() {
		$jpms = Jetpack_Network::init();

		$url = $jpms->get_url(  array( 'name' => 'subsiteregister', 'site_id' => 123 ) );

		$expected_url = 'http://example.org/wp-admin/network/admin.php?page=jetpack&action=subsiteregister&site_id=123';

		$this->assertInternalType( 'string', $url );
		$this->assertEquals( $expected_url, $url );
	}

	/**
	 * @author enkrates
	 * @covers Jetpack_Network::get_url
	 * @since 3.2
	 */
	public function test_get_url_returns_null_for_underspecified_subsiteregister() {
		$jpms = Jetpack_Network::init();

		$this->assertNull( $jpms->get_url(  array( 'name' => 'subsiteregister' ) ) );
	}

	/**
	 * @author enkrates
	 * @covers Jetpack_Network::get_url
	 * @since 3.2
	 */
	public function test_get_url_returns_correct_string_for_subsitedisconnect() {
		$jpms = Jetpack_Network::init();

		$url = $jpms->get_url(  array( 'name' => 'subsitedisconnect', 'site_id' => 123 ) );

		$expected_url = 'http://example.org/wp-admin/network/admin.php?page=jetpack&action=subsitedisconnect&site_id=123';

		$this->assertInternalType( 'string', $url );
		$this->assertEquals( $expected_url, $url );
	}

	/**
	 * @author enkrates
	 * @covers Jetpack_Network::get_url
	 * @since 3.2
	 */
	public function test_get_url_returns_null_for_underspecified_subsitedisconnect() {
		$jpms = Jetpack_Network::init();

		$this->assertNull( $jpms->get_url(  array( 'name' => 'subsitedisconnect' ) ) );
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
	public function test_body_class_contains_network_admin() {
		$jpms = Jetpack_Network::init();

		$classes = $jpms->body_class( '' );

		$this->assertInternalType( 'string', $classes );
		$this->assertContains( 'network-admin', $classes );
	}


} // end class
