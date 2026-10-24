<?php
/**
 * Tests for the admin bar launch button.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launch-button/index.php';

/**
 * Class Launch_Button_Test
 */
class Launch_Button_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up each test.
	 */
	public function set_up() {
		parent::set_up();

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'launch_button_admin',
				'user_pass'  => 'password',
				'user_email' => 'launch_button_admin@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );
		update_option( 'launch-status', 'unlaunched' );
	}

	/**
	 * Tear down each test.
	 */
	public function tear_down() {
		remove_all_filters( 'wpcom_site_launch_publish_copy_override_is_treatment' );
		delete_option( 'launch-status' );
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * The button says "Launch site" in the control and "Publish site" in the treatment.
	 */
	public function test_button_label_follows_the_publish_copy_experiment() {
		add_filter( 'wpcom_site_launch_publish_copy_override_is_treatment', '__return_false' );
		$this->assertStringContainsString( '<span class="ab-label">Launch site</span>', $this->get_button_title() );

		remove_all_filters( 'wpcom_site_launch_publish_copy_override_is_treatment' );
		add_filter( 'wpcom_site_launch_publish_copy_override_is_treatment', '__return_true' );
		$this->assertStringContainsString( '<span class="ab-label">Publish site</span>', $this->get_button_title() );
	}

	/**
	 * The launch button node's title.
	 *
	 * @return string
	 */
	private function get_button_title() {
		$admin_bar = new \WP_Admin_Bar();
		wpcom_add_launch_button_to_admin_bar( $admin_bar );

		$node = $admin_bar->get_node( 'launch-site' );
		$this->assertNotNull( $node, 'The launch button was not added.' );

		return $node->title;
	}
}
