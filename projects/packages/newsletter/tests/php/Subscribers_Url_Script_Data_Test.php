<?php
/**
 * Tests for the Subscribers tab URL in the admin script data.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Settings;
use Automattic\Jetpack\Newsletter\Urls;
use PHPUnit\Framework\Attributes\CoversMethod;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Newsletter\Settings::add_subscribers_url_script_data
 */
#[CoversMethod( Settings::class, 'add_subscribers_url_script_data' )]
class Subscribers_Url_Script_Data_Test extends BaseTestCase {

	/**
	 * Load the admin menu API the Subscribers tab check reads.
	 */
	public function set_up() {
		parent::set_up();

		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	/**
	 * Drop the registered page, the current user, and the hooks.
	 */
	public function tear_down() {
		unset( $GLOBALS['_parent_pages'], $GLOBALS['_registered_pages'], $GLOBALS['submenu'] );
		wp_set_current_user( 0 );
		remove_all_filters( 'jetpack_admin_js_script_data' );
		remove_all_filters( 'jetpack_module_configuration_url_subscriptions' );
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'admin_init' );
		remove_all_actions( 'admin_enqueue_scripts' );
		remove_all_filters( Settings::MODERNIZATION_FILTER );
		remove_all_filters( 'jetpack_wp_admin_subscriber_management_enabled' );

		parent::tear_down();
	}

	/**
	 * Registers the Newsletter page as Settings does, for a current user with the given role.
	 *
	 * @param string $role The current user's role.
	 */
	private function register_newsletter_page_as( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'newsletter_' . $role,
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );

		add_submenu_page( 'jetpack', 'Newsletter', 'Newsletter', 'manage_options', Settings::ADMIN_PAGE_SLUG, '__return_null' );
	}

	public function test_script_data_carries_the_subscribers_url_for_a_user_who_can_open_the_page() {
		$this->register_newsletter_page_as( 'administrator' );

		$data = Settings::add_subscribers_url_script_data( array() );

		$this->assertSame( Urls::get_subscribers_url(), $data['newsletter']['subscribersUrl'] );
	}

	public function test_no_subscribers_url_for_a_user_the_page_is_not_registered_for() {
		$this->register_newsletter_page_as( 'editor' );

		$data = Settings::add_subscribers_url_script_data( array() );

		$this->assertNull( $data['newsletter']['subscribersUrl'] );
	}

	public function test_no_subscribers_url_when_the_legacy_settings_only_page_is_forced() {
		$this->register_newsletter_page_as( 'administrator' );
		add_filter( Settings::MODERNIZATION_FILTER, '__return_false' );

		$data = Settings::add_subscribers_url_script_data( array() );

		$this->assertNull( $data['newsletter']['subscribersUrl'] );
	}

	public function test_no_subscribers_url_when_wp_admin_subscriber_management_is_disabled() {
		$this->register_newsletter_page_as( 'administrator' );
		add_filter( 'jetpack_wp_admin_subscriber_management_enabled', '__return_false' );

		$data = Settings::add_subscribers_url_script_data( array() );

		$this->assertNull( $data['newsletter']['subscribersUrl'] );
	}

	public function test_newsletter_page_script_data_does_not_drop_the_subscribers_url() {
		$this->register_newsletter_page_as( 'administrator' );
		$settings = new Settings();
		$settings->init_hooks();
		$settings->admin_init();

		$data = apply_filters( 'jetpack_admin_js_script_data', array() );

		$this->assertArrayHasKey( 'isBlockTheme', $data['newsletter'] );
		$this->assertSame( Urls::get_subscribers_url(), $data['newsletter']['subscribersUrl'] );
	}
}
