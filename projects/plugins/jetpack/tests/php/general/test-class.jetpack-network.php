<?php
/**
 * Tests the Jetpack_Network class.
 *
 * @package automattic/jetpack
 */

if ( is_multisite() ) :

	/**
	 * Test class for the Jetpack_Network class.
	 */
	class WP_Test_Jetpack_Network extends WP_UnitTestCase {

		/**
		 * Confirms the instance is generated from the init.
		 *
		 * @since 2.5
		 */
		public function test_jetpack_network_init_returns_jetpack_network() {
			$this->assertInstanceOf( 'Jetpack_Network', Jetpack_Network::init() );
		}

		/**
		 * Tests the get_url function.
		 *
		 * @author enkrates
		 * @covers Jetpack_Network::get_url
		 * @since 3.2
		 */
		public function test_get_url_returns_correct_string_for_network_admin_page() {
			$jpms = Jetpack_Network::init();

			$url          = $jpms->get_url( 'network_admin_page' );
			$expected_url = '/wp-admin/network/admin.php?page=jetpack';

			$this->assertIsString( $url );
			$this->assertStringEndsWith( $expected_url, $url );
		}

		/**
		 * Tests that null is returned for invalid input.
		 *
		 * @author enkrates
		 * @covers Jetpack_Network::get_url
		 * @since 3.2
		 */
		public function test_get_url_returns_null_for_invalid_input() {
			$jpms = Jetpack_Network::init();

			$this->assertNull( $jpms->get_url( 1234 ) );
		}

		/**
		 * Tests if get_url returns the correct string.
		 *
		 * @author enkrates
		 * @covers Jetpack_Network::get_url
		 * @since 3.2
		 */
		public function test_get_url_returns_correct_string_for_subsiteregister() {
			$jpms = Jetpack_Network::init();

			$url          = $jpms->get_url(
				array(
					'name'    => 'subsiteregister',
					'site_id' => 123,
				)
			);
			$expected_url = '/wp-admin/network/admin.php?page=jetpack&action=subsiteregister&site_id=123';

			$this->assertIsString( $url );
			$this->assertStringEndsWith( $expected_url, $url );

		}

		/**
		 * Tests if get_url returns the correct string for an unspecified site.
		 *
		 * @author enkrates
		 * @covers Jetpack_Network::get_url
		 * @since 3.2
		 */
		public function test_get_url_returns_null_for_underspecified_subsiteregister() {
			$jpms = Jetpack_Network::init();

			$this->assertNull( $jpms->get_url( array( 'name' => 'subsiteregister' ) ) );
		}

		/**
		 * Tests if get_url returns the correct string for subsite disconnect.
		 *
		 * @author enkrates
		 * @covers Jetpack_Network::get_url
		 * @since 3.2
		 */
		public function test_get_url_returns_correct_string_for_subsitedisconnect() {
			$jpms = Jetpack_Network::init();

			$url          = $jpms->get_url(
				array(
					'name'    => 'subsitedisconnect',
					'site_id' => 123,
				)
			);
			$expected_url = '/wp-admin/network/admin.php?page=jetpack&action=subsitedisconnect&site_id=123';

			$this->assertIsString( $url );
			$this->assertStringEndsWith( $expected_url, $url );
		}

		/**
		 * Tests if get_url returns the correct string for an unspecified disconnect.
		 *
		 * @author enkrates
		 * @covers Jetpack_Network::get_url
		 * @since 3.2
		 */
		public function test_get_url_returns_null_for_underspecified_subsitedisconnect() {
			$jpms = Jetpack_Network::init();

			$this->assertNull( $jpms->get_url( array( 'name' => 'subsitedisconnect' ) ) );
		}

		/**
		 * Tests the body class includes 'network-admin'/
		 *
		 * @since 2.8
		 **/
		public function test_body_class_contains_network_admin() {
			$jpms = Jetpack_Network::init();

			$classes = $jpms->body_class( '' );

			$this->assertIsString( $classes );
			$this->assertStringContainsString( 'network-admin', $classes );
		}

		/**
		 * Tests that the network option exists.
		 *
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
		 * Tests that the file_data option exists.
		 *
		 * @author igmoweb
		 * @covers Jetpack_Options::update_option
		 * @since 4.8
		 */
		public function test_update_file_data_network_options() {
			$value = array( 'just', 'a', 'sample' );
			Jetpack_Options::update_option( 'file_data', $value );

			$this->assertEquals( $value, Jetpack_Options::get_option( 'file_data' ) );

			// Make sure that the option is in wp_sitemeta.
			$this->assertEquals( $value, get_site_option( 'jetpack_file_data' ) );

			// And is not in wp_options.
			$this->assertFalse( get_option( 'jetpack_file_data' ) );
		}

		/**
		 * Tests that we can delete the file_data option.
		 *
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
		 * Tests that network options are ensured autoloaded.
		 *
		 * @author igmoweb
		 * @covers Jetpack_Options::delete_option
		 * @since 4.8
		 */
		public function test_get_network_option_and_ensure_autoload() {
			$default = array( 'just', 'a', 'sample' );
			Jetpack_Options::get_option_and_ensure_autoload( 'jetpack_file_data', $default );
			$this->assertEquals( $default, Jetpack_Options::get_option( 'file_data' ) );
		}

		/**
		 * Tests the Jetpack_Network::set_multisite_disconnect_cap method.
		 *
		 * @param bool $is_super_admin Whether the current user is a super admin.
		 * @param bool $connection_override The sub-site connection override setting.
		 * @param bool $disconnect_allowed Whether the disconnect capability should be allowed.
		 *
		 * @covers Jetpack_Network::set_multisite_disconnect_cap
		 * @dataProvider data_provider_test_set_multisite_disconnect_caps
		 */
		public function test_set_multisite_disconnect_cap( $is_super_admin, $connection_override, $disconnect_allowed ) {
			$test_cap        = array( 'test_cap' );
			$expected_output = $disconnect_allowed ? $test_cap : array( 'do_not_allow' );

			$user_id = self::factory()->user->create( array( 'user_login' => 'test_user' ) );
			wp_set_current_user( $user_id );
			if ( $is_super_admin ) {
				grant_super_admin( $user_id );
			}

			update_site_option( 'jetpack-network-settings', array( 'sub-site-connection-override' => $connection_override ) );

			$this->assertEquals( $expected_output, Jetpack_Network::init()->set_multisite_disconnect_cap( $test_cap ) );
		}

		/**
		 * Data provider for test_set_multisite_disconnect_caps.
		 *
		 * Each test data set is provided as an array:
		 * array {
		 *     bool $is_super_admin Whether the current user is a super admin.
		 *     bool $connection_override The sub-site connection override setting.
		 *     bool $disconnect_allowed Whether the user should have the jetpack_disconnect capability. This value is set
		 *                              based on the values of $is_super_admin and $connection_override.
		 * }
		 */
		public function data_provider_test_set_multisite_disconnect_caps() {
			return array(
				'is_super_admin: true; connection_override: true'   => array( true, true, true ),
				'is_super_admin: true; connection_override: false'  => array( true, false, true ),
				'is_super_admin: false; connection_override: true'  => array( false, true, true ),
				'is_super_admin: false; connection_override: false' => array( false, false, false ),
			);
		}

	} // end class
endif;
