<?php
/**
 * Anyone Can Register Notice Test file.
 *
 * @package wpcomsh
 */

/**
 * Class AnyoneCanRegisterNoticeTest.
 */
class AnyoneCanRegisterNoticeTest extends WP_UnitTestCase {

	/**
	 * Run setup steps before each test.
	 */
	public function setUp(): void {
		parent::setUp();
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Test only runs on single site.' );
		}
		// Prevent error notice from Atomic MU plugin.
		$_SERVER['HTTP_X_FORWARDED_FOR'] = '127.0.0.1';
		$_SERVER['HTTP_USER_AGENT']      = 'WordPress.com; https://wordpress.com/';
		$_SERVER['QUERY_STRING']         = '';
		$_SERVER['HTTP_ACCEPT_LANGUAGE'] = 'en-US,en;q=0.5';
		$_SERVER['GEOIP_COUNTRY_CODE']   = 'US';
		$_SERVER['HTTP_X_JA3_HASH']      = 'a2d9';
	}

	/**
	 * Test show warning for administrators when users_can_register option is active for intended roles: i.e. 'administrator`, `shop_manager`, `editor`, `author`
	 *
	 * @param string $role role to test.
	 * @dataProvider role_provider_show
	 */
	public function test_anyone_register_warning_added_for_administrator( $role ) {
		add_role( 'shop_manager', 'Shop Manager' ); // adding here because it's not a default role; added by WooCommerce generally
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'users_can_register', true );
		update_option( 'default_role', $role );
		$output = get_echo( 'wpcomsh_anyone_register_warning' );
		$this->assertStringContainsString( 'anyone-can-register-notice', $output );
	}

	/**
	 * Data provider for test_anyone_register_warning_added_for_administrator.
	 *
	 * @return array
	 */
	public function role_provider_show() {
		return array(
			array( 'administrator' ),
			array( 'shop_manager' ),
			array( 'editor' ),
			array( 'author' ),
		);
	}

	/**
	 * Test confirm warning doesn't show for unintended roles: i.e. not 'administrator`, `shop_manager`, `editor`, `author`
	 *
	 * @param string $role role to test.
	 * @dataProvider role_provider_hide
	 */
	public function test_anyone_register_warning_displays_for_specific_roles( $role ) {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'users_can_register', true );
		update_option( 'default_role', $role );
		$output = get_echo( 'wpcomsh_anyone_register_warning' );
		$this->assertStringNotContainsString( 'anyone-can-register-notice', $output );
	}

	/**
	 * Data provider for test_anyone_register_warning_displays_for_specific_roles.
	 *
	 * @return array
	 */
	public function role_provider_hide() {
		return array(
			array( 'contributor' ),
			array( 'subscriber' ),
			array( 'member' ),
		);
	}

	/**
	 * Test do not show warning for administrators when users_can_register option is inactive.
	 */
	public function test_anyone_register_warning_not_added_for_administrator_when_option_inactive() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'users_can_register', false );
		$output = get_echo( 'wpcomsh_anyone_register_warning' );
		$this->assertEmpty( $output );
	}

	/**
	 * Test do not show warning for administrators when users_can_register option is active and WPCOMSH_ACR_DISMISSED_METADATA exists.
	 */
	public function test_anyone_register_warning_not_added_for_administrator_when_metadata_exists() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'users_can_register', true );
		update_user_meta( get_current_user_id(), WPCOMSH_ACR_DISMISSED_METADATA, '1' );
		$output = get_echo( 'wpcomsh_anyone_register_warning' );
		$this->assertEmpty( $output );
	}

	/**
	 * Test do not show warning for non-administrators when users_can_register is active
	 */
	public function test_anyone_register_warning_not_added_for_non_administrator_when_option_active() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		update_option( 'users_can_register', true );
		$output = get_echo( 'wpcomsh_anyone_register_warning' );
		$this->assertEmpty( $output );
	}

	/**
	 * Test if metadata is added when dismissal action occurs.
	 */
	public function test_ajax_dismiss_notice() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		// Simulate the AJAX request
		$_SERVER['REQUEST_METHOD'] = 'POST';
		$_POST['action']           = 'anyone_can_register_dismiss_notice';
		$_REQUEST['_ajax_nonce']   = wp_create_nonce( 'anyone_can_register_ajax_nonce' );

		// Call the AJAX handler function
		wpcomsh_ajax_anyone_can_register_handle_dismissal();

		// Check if the metadata is added correctly
		$this->assertSame( '1', get_user_meta( get_current_user_id(), WPCOMSH_ACR_DISMISSED_METADATA, true ) );
	}

	/**
	 * Test if the dismissal fails when there's an invalid nonce.
	 */
	public function test_ajax_dismiss_notice_invalid_nonce() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		// Simulate the AJAX request with an invalid nonce
		$_SERVER['REQUEST_METHOD'] = 'POST';
		$_POST['action']           = 'anyone_can_register_dismiss_notice';
		$_REQUEST['_ajax_nonce']   = 'invalid_nonce';

		// Call the AJAX handler function
		wpcomsh_ajax_anyone_can_register_handle_dismissal();

		// Check if the metadata is not updated
		$this->assertNotEquals( '1', get_user_meta( get_current_user_id(), WPCOMSH_ACR_DISMISSED_METADATA, true ) );
	}

	/**
	 * Test if the metadata is cleared when users_can_register option is disabled.
	 */
	public function test_metadata_cleared_when_option_disabled() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'users_can_register', true );
		update_user_meta( get_current_user_id(), WPCOMSH_ACR_DISMISSED_METADATA, '1' );
		update_option( 'users_can_register', false );
		$this->assertSame( '', get_user_meta( get_current_user_id(), WPCOMSH_ACR_DISMISSED_METADATA, true ) );
	}

	/**
	 * Test if the metadata is cleared when users_can_register option is disabled when WPCOMSH_ACR_DISMISSED_METADATA exists for multiple users.
	 */
	public function test_metadata_cleared_when_option_disabled_multiple_users() {
		global $wpdb;
		$metakey = WPCOMSH_ACR_DISMISSED_METADATA;
		update_option( 'users_can_register', true );
		self::factory()->user->create_many( 2, array( 'role' => 'administrator' ) );
		$admin_ids = get_users(
			array(
				'role'   => 'administrator',
				'fields' => 'ids',
			)
		);
		foreach ( $admin_ids as $user ) {
			update_user_meta( $user, WPCOMSH_ACR_DISMISSED_METADATA, '1' );
		}
		update_option( 'users_can_register', false );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$this->assertSame( 0, $wpdb->query( $wpdb->prepare( "SELECT * FROM $wpdb->usermeta WHERE meta_key = %s", $metakey ) ) );
	}

	/**
	 * Test if the metadata is cleared when users_can_register option is disabled when WPCOMSH_ACR_DISMISSED_METADATA exists for 25 users.
	 */
	public function test_metadata_cleared_when_option_disabled_25_users() {
		global $wpdb;
		$metakey = WPCOMSH_ACR_DISMISSED_METADATA;
		update_option( 'users_can_register', true );
		self::factory()->user->create_many( 25, array( 'role' => 'administrator' ) );
		$admin_ids = get_users(
			array(
				'role'   => 'administrator',
				'fields' => 'ids',
			)
		);
		foreach ( $admin_ids as $user ) {
			update_user_meta( $user, WPCOMSH_ACR_DISMISSED_METADATA, '1' );
		}
		update_option( 'users_can_register', false );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$this->assertSame( 0, $wpdb->query( $wpdb->prepare( "SELECT * FROM $wpdb->usermeta WHERE meta_key = %s", $metakey ) ) );
	}

	/**
	 * Test if dismissal metadata for other notices is changed when users_can_register option is disabled.
	 */
	public function test_metadata_cleared_when_option_disabled_other_notices() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'users_can_register', true );
		update_user_meta( get_current_user_id(), 'wpcomsh_expired_plan_dismissed_notice', '1' );
		update_option( 'users_can_register', false );
		$this->assertSame( '1', get_user_meta( get_current_user_id(), 'wpcomsh_expired_plan_dismissed_notice', true ) );
	}
}
