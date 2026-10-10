<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Tests for Red_Bubble_Notifications.
 *
 * @package automattic/my-jetpack
 * @covers \Automattic\Jetpack\My_Jetpack\Red_Bubble_Notifications
 */
#[CoversClass( Red_Bubble_Notifications::class )]
class Red_Bubble_Notifications_Test extends TestCase {

	/**
	 * Connection manager whose meta-cap map resolves `jetpack_connect`, which this bootstrap doesn't wire.
	 *
	 * @var Connection_Manager
	 */
	private $manager;

	/**
	 * Set up a site connection with no user connections and a historically active product that needs one.
	 */
	public function setUp(): void {
		parent::setUp();

		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );
		Jetpack_Options::update_option( 'historically_active_modules', array( 'search' ) );
		( new Connection_Manager() )->reset_connection_status();

		$this->manager = new Connection_Manager();
		add_filter( 'map_meta_cap', array( $this->manager, 'jetpack_connection_custom_caps' ), 1, 4 );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		remove_filter( 'map_meta_cap', array( $this->manager, 'jetpack_connection_custom_caps' ), 1 );
		remove_all_filters( 'jetpack_disconnect_cap' );
		wp_set_current_user( 0 );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
		( new Connection_Manager() )->reset_connection_status();

		parent::tearDown();
	}

	/**
	 * Log in a new user with the given role.
	 *
	 * @param string $role The user's role.
	 * @return \WP_User
	 */
	private function log_in_as( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => "test_$role",
				'user_pass'  => '123',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );

		return wp_get_current_user();
	}

	/**
	 * A user who can take the vacant owner slot is alerted about the missing user connection.
	 */
	public function test_alerts_missing_user_connection_when_user_can_take_ownership() {
		$this->log_in_as( 'administrator' );

		$this->assert_user_alert( Red_Bubble_Notifications::alert_if_missing_connection( array() ) );
	}

	/**
	 * A secondary user's token doesn't hide the alert while no owner is recorded.
	 */
	public function test_alerts_missing_user_connection_when_only_a_secondary_user_is_connected() {
		$editor_id = wp_insert_user(
			array(
				'user_login' => 'test_connected_editor',
				'user_pass'  => '123',
				'role'       => 'editor',
			)
		);
		( new Tokens() )->update_user_token( $editor_id, "token.secret.$editor_id", false );
		$this->log_in_as( 'administrator' );
		( new Connection_Manager() )->reset_connection_status();

		$this->assert_user_alert( Red_Bubble_Notifications::alert_if_missing_connection( array() ) );
	}

	/**
	 * A role granted connection rights through `jetpack_disconnect_cap` is alerted too.
	 */
	public function test_alerts_missing_user_connection_when_role_is_granted_connection_rights() {
		add_filter(
			'jetpack_disconnect_cap',
			static function () {
				return array( 'edit_others_posts' );
			}
		);
		$this->log_in_as( 'editor' );

		$this->assert_user_alert( Red_Bubble_Notifications::alert_if_missing_connection( array() ) );
	}

	/**
	 * Assert the alerts hold the missing user connection alert.
	 *
	 * @param array $alerts The alerts returned by alert_if_missing_connection().
	 */
	private function assert_user_alert( $alerts ) {
		$this->assertSame(
			array(
				'type'     => 'user',
				'is_error' => true,
			),
			$alerts['missing-connection'] ?? null
		);
	}

	/**
	 * A recorded owner without a token is left to the connection error notice, even for an admin.
	 */
	public function test_skips_missing_user_connection_when_owner_is_recorded() {
		$this->log_in_as( 'administrator' );
		Jetpack_Options::update_option( 'master_user', get_current_user_id() );
		( new Connection_Manager() )->reset_connection_status();

		$alerts = Red_Bubble_Notifications::alert_if_missing_connection( array() );

		$this->assertArrayNotHasKey( 'missing-connection', $alerts );
	}

	/**
	 * A user who can't take the vacant owner slot (e.g. an editor) gets no connect CTA.
	 */
	public function test_skips_missing_user_connection_when_user_cannot_take_ownership() {
		$this->log_in_as( 'editor' );

		$alerts = Red_Bubble_Notifications::alert_if_missing_connection( array() );

		$this->assertArrayNotHasKey( 'missing-connection', $alerts );
	}
}
