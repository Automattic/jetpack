<?php
if ( is_multisite() ) :

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
		$expected_url = '/wp-admin/network/admin.php?page=jetpack';

		$this->assertInternalType( 'string', $url );
		$this->assertStringEndsWith( $expected_url, $url );
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
		$expected_url = '/wp-admin/network/admin.php?page=jetpack&action=subsiteregister&site_id=123';

		$this->assertInternalType( 'string', $url );
		$this->assertStringEndsWith( $expected_url, $url );

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
		$expected_url = '/wp-admin/network/admin.php?page=jetpack&action=subsitedisconnect&site_id=123';

		$this->assertInternalType( 'string', $url );
		$this->assertStringEndsWith( $expected_url, $url );
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

	/**
	 * @author igmoweb
	 * @covers Jetpack_Options::is_network_option
	 * @since 4.8
	 */
	public function test_is_network_option() {
		$network_options = Jetpack_Options::get_option_names( 'network' );
		foreach ( $network_options as $option_name ) {
			$this->assertTrue( Jetpack_Options::is_network_option( $option_name ) );
		}
		$this->assertFalse( Jetpack_Options::is_network_option( 'version' ) );
	}


	/**
	 * @author igmoweb
	 * @covers Jetpack_Options::update_option
	 * @since 4.8
	 */
	public function test_update_file_data_network_options() {
		$value = array( 'just', 'a', 'sample' );
		Jetpack_Options::update_option( 'file_data', $value );

		$this->assertEquals( $value, Jetpack_Options::get_option( 'file_data' ) );

		// Make sure that the option is in wp_sitemeta
		$this->assertEquals( $value, get_site_option('jetpack_file_data' ) );

		// And is not in wp_options
		$this->assertFalse( get_option('jetpack_file_data' ) );
	}

	/**
	 * @author igmoweb
	 * @covers Jetpack_Options::get_option_and_ensure_autoload
	 * @since 4.8
	 */
	public function test_delete_file_data_network_options() {
		$value = array( 'just', 'a', 'sample' );
		Jetpack_Options::update_option( 'file_data', $value );
		Jetpack_Options::delete_option( 'file_data' );
		$this->assertFalse( Jetpack_Options::get_option( 'file_data' ) );
	}

	/**
	 * @author igmoweb
	 * @covers Jetpack_Options::delete_option
	 * @since 4.8
	 */
	public function test_get_network_option_and_ensure_autoload() {
		$default = array( 'just', 'a', 'sample' );
		$value = Jetpack_Options::get_option_and_ensure_autoload( 'jetpack_file_data', $default );
		$this->assertEquals( $default, Jetpack_Options::get_option( 'file_data' ) );
	}

} // end class
endif;
