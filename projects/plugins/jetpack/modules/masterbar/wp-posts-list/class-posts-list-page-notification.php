<?php
/**
 * Posts_List_Page_Notification file.
 * Disable edit_post and delete_post capabilities for Posts Pages in WP-Admin and display a notification icon.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\Posts_List_Page_Notification instead.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\Posts_List_Page_Notification as Masterbar_Posts_List_Page_Notification;

/**
 * Class Posts_List_Page_Notification
 *
 * @package Automattic\Jetpack\Dashboard_Customizations
 */
class Posts_List_Page_Notification {

	/**
	 * Instance of \Automattic\Jetpack\Masterbar\Posts_List_Page_Notification
	 * Used for deprecation purposes.
	 *
	 * @var \Automattic\Jetpack\Masterbar\Posts_List_Page_Notification
	 */
	private $post_list_page_notification_wrapper;

	/**
	 * Posts_List_Page_Notification constructor.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $posts_page_id The Posts page configured in WordPress.
	 * @param string $show_on_front The show_on_front site option.
	 * @param string $page_on_front The page_on_front site_option.
	 */
	public function __construct( $posts_page_id, $show_on_front, $page_on_front ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Posts_List_Page_Notification::__construct' );
		$this->post_list_page_notification_wrapper = new Masterbar_Posts_List_Page_Notification( $posts_page_id, $show_on_front, $page_on_front );
	}

	/**
	 * Add in all hooks.
	 *
	 * @deprecated 13.7
	 */
	public function init_actions() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Posts_List_Page_Notification::init_actions' );
		$this->post_list_page_notification_wrapper->init_actions();
	}

	/**
	 * Creates instance.
	 *
	 * @deprecated 13.7
	 *
	 * @return \Automattic\Jetpack\Masterbar\Posts_List_Page_Notification
	 */
	public static function init() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Posts_List_Page_Notification::init' );
		return Masterbar_Posts_List_Page_Notification::init();
	}

	/**
	 * Disable editing and deleting for the page that is configured as a Posts Page.
	 *
	 * @deprecated 13.7
	 *
	 * @param array  $caps Array of capabilities.
	 * @param string $cap The current capability.
	 * @param string $user_id The user id.
	 * @param array  $args Argument array.
	 * @return array
	 */
	public function disable_posts_page( $caps, $cap, $user_id, $args ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Posts_List_Page_Notification::disable_posts_page' );
		return $this->post_list_page_notification_wrapper->disable_posts_page( $caps, $cap, $user_id, $args );
	}

	/**
	 * Load the CSS for the WP Posts List
	 *
	 * @deprecated 13.7
	 *
	 * We would probably need to move this elsewhere when new features are introduced to wp-posts-list.
	 */
	public function enqueue_css() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Posts_List_Page_Notification::enqueue_css' );
		$this->post_list_page_notification_wrapper->enqueue_css();
	}

	/**
	 * Adds a CSS class on the page configured as a Posts Page.
	 *
	 * @deprecated 13.7
	 *
	 * @param array  $classes A list of CSS classes.
	 * @param string $class A CSS class.
	 * @param string $post_id The current post id.
	 * @return array
	 */
	public function add_posts_page_css_class( $classes, $class, $post_id ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Posts_List_Page_Notification::add_posts_page_css_class' );
		return $this->post_list_page_notification_wrapper->add_posts_page_css_class( $classes, $class, $post_id );
	}

	/**
	 * Add a info icon on the Posts Page letting the user know why they cannot delete and remove the page.
	 *
	 * @deprecated 13.7
	 */
	public function add_notification_icon() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Posts_List_Page_Notification::add_notification_icon' );
		$this->post_list_page_notification_wrapper->add_notification_icon();
	}
}
