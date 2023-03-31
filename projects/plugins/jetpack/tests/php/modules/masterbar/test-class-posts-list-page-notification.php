<?php
/**
 * Tests for Posts_List_Page_Notification class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Posts_List_Page_Notification;

require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/wp-posts-list/class-posts-list-page-notification.php';

/**
 * Class Test_Posts_List_Page_Notification.
 *
 * @coversDefaultClass Automattic\Jetpack\Dashboard_Customizations\Posts_List_Page_Notification
 */
class Test_Posts_List_Page_Notification extends WP_UnitTestCase {

	/**
	 * Check if the actions are attached.
	 */
	public function test_it_has_instance_loaded() {
		$instance = new Posts_List_Page_Notification( '5', 'page', '4' );

		$this->assertSame( 10, has_action( 'init', array( $instance, 'init_actions' ) ) );

		$instance->init_actions();

		$this->assertSame( 10, has_action( 'map_meta_cap', array( $instance, 'disable_posts_page' ) ) );
		$this->assertSame( 10, has_action( 'post_class', array( $instance, 'add_posts_page_css_class' ) ) );
		$this->assertSame( 10, has_action( 'admin_print_footer_scripts-edit.php', array( $instance, 'add_notification_icon' ) ) );
	}

	/**
	 * Check if it appends the CSS class.
	 */
	public function test_it_appends_css_class() {
		$instance = new Posts_List_Page_Notification( '5', 'page', '4' );

		$classes = $instance->add_posts_page_css_class( array(), 'fox', 5 );
		$this->assertEquals( array( 'posts-page' ), $classes );

		$classes = $instance->add_posts_page_css_class( array( 'bar' ), 'fox', 5 );
		$this->assertEquals( array( 'bar', 'posts-page' ), $classes );

		$classes = $instance->add_posts_page_css_class( array( 'bar' ), 'fox', 6 );
		$this->assertEquals( array( 'bar' ), $classes );
	}

	/**
	 * Check if do_not_allow capability is added on Posts Page.
	 */
	public function test_it_disables_posts_page() {
		$instance = new Posts_List_Page_Notification( '5', 'page', '' );

		$this->assertEquals( array( 'do_not_allow' ), $instance->disable_posts_page( array(), 'edit_post', '6', array( 0 => 5 ) ) );
		$this->assertEquals( array( 'do_not_allow' ), $instance->disable_posts_page( array(), 'delete_post', '6', array( 0 => 5 ) ) );

		$this->assertEquals( array(), $instance->disable_posts_page( array(), 'edit_post', '6', array( 0 => 6 ) ) );
		$this->assertEquals( array(), $instance->disable_posts_page( array(), 'delete_post', '6', array( 0 => 6 ) ) );
	}

	/**
	 * Check that the hooks are not loaded when the show_on_front option is not "page".
	 */
	public function test_it_is_not_loaded_when_show_on_front_option_is_not_page() {
		$instance = new Posts_List_Page_Notification( '5', 'posts', '1' );

		$this->assertFalse( has_action( 'init', array( $instance, 'init_actions' ) ) );
	}

	/**
	 * Check that the hooks are not loaded when the posts page id and the home page id are the same.
	 *
	 * Although in the WP-Admin interface, when the same page is selected in both dropdowns the posts page dropdown is reset,
	 * internally WordPress will still store the page id in "page_for_posts" site_option.
	 */
	public function test_it_is_not_loaded_when_posts_page_id_and_home_page_id_are_the_same() {
		$instance = new Posts_List_Page_Notification( '5', 'page', '5' );
		$this->assertFalse( has_action( 'init', array( $instance, 'init_actions' ) ) );
	}
}
