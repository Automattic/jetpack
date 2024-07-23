<?php
/**
 * Masterbar file.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\Masterbar instead.
 *
 * @package automattic/jetpack
 *
 * @phan-file-suppress PhanDeprecatedFunction -- Ok for deprecated code to call other deprecated code.
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\Masterbar as Jetpack_Masterbar;
use WP_Admin_Bar;

/**
 * Provides custom admin bar instead of the default WordPress admin bar.
 */
class Masterbar {

	/**
	 * Instance of \Automattic\Jetpack\Masterbar\Masterbar
	 * Used for deprecation purposes.
	 *
	 * @var \Automattic\Jetpack\Masterbar\Masterbar
	 */
	private $masterbar_wrapper;

	/**
	 * Constructor
	 *
	 * @deprecated 13.7
	 */
	public function __construct() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::__construct' );
		$this->masterbar_wrapper = new Jetpack_Masterbar();
	}

	/**
	 * Initialize our masterbar.
	 *
	 * @deprecated 13.7
	 */
	public function init() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::init' );
		$this->masterbar_wrapper->init();
	}

	/**
	 * Log out from WordPress.com when logging out of the local site.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $redirect_to The redirect destination URL.
	 */
	public function maybe_logout_user_from_wpcom( $redirect_to ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::maybe_logout_user_from_wpcom' );
		return $this->masterbar_wrapper->maybe_logout_user_from_wpcom( $redirect_to );
	}

	/**
	 * Adds CSS classes to admin body tag.
	 *
	 * @deprecated 13.7
	 *
	 * @since 5.1
	 *
	 * @param string $admin_body_classes CSS classes that will be added.
	 *
	 * @return string
	 */
	public function admin_body_class( $admin_body_classes ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::admin_body_class' );
		return $this->masterbar_wrapper->admin_body_class( $admin_body_classes );
	}

	/**
	 * Remove the default Admin Bar CSS.
	 *
	 * @deprecated 13.7
	 */
	public function remove_core_styles() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::remove_core_styles' );
		$this->masterbar_wrapper->remove_core_styles();
	}

	/**
	 * Enqueue our own CSS and JS to display our custom admin bar.
	 *
	 * @deprecated 13.7
	 */
	public function add_styles_and_scripts() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::add_styles_and_scripts' );
		$this->masterbar_wrapper->add_styles_and_scripts();
	}

	/**
	 * Remove the default admin bar items and replace it with our own admin bar.
	 *
	 * @deprecated 13.7
	 */
	public function replace_core_masterbar() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::replace_core_masterbar' );
		$this->masterbar_wrapper->replace_core_masterbar();
	}

	/**
	 * This reorganizes the original wp admin bar for when an atomic site
	 * has the wpcom_admin_interface set to wp-admin.
	 *
	 * The wpcom_admin_interface = wp-admin setting indicates that the users wishes
	 * to NOT use the wpcom master bar. We do need to adjust a couple of things
	 * though.
	 *
	 * @deprecated 13.7
	 *
	 * @param WP_Admin_Bar $bar The admin bar object.
	 *
	 * @return void
	 */
	protected function build_wp_admin_interface_bar( $bar ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::build_wp_admin_interface_bar' );
		$nodes = array();

		// First, lets gather all nodes and remove them.
		foreach ( $bar->get_nodes() as $node ) {
			$nodes[ $node->id ] = $node;
			$bar->remove_node( $node->id );
		}

		// This disables a submenu from being placed under the My Sites button.
		add_filter( 'jetpack_load_admin_menu_class', '__return_true' );

		// Here we add the My sites and Reader buttons
		$this->wpcom_adminbar_add_secondary_groups( $bar );
		$this->add_my_sites_submenu( $bar );
		$this->add_reader_submenu( $bar );

		foreach ( $nodes as $id => $node ) {

			$bar->add_node( $node );
			// Add our custom node and change the title of the edit profile node.
			if ( 'edit-profile' === $id ) {
				$this->add_wpcom_profile_link( $bar );
				$bar->add_node(
					array(
						'id'    => 'edit-profile',
						'title' => __( 'Site Profile', 'jetpack' ),
					)
				);
			}
		}

		// Add a menu item to the user menu
		// Add a custom link to the user menu.
		$this->add_wpcom_profile_link( $bar );

		// Remove some things
		$bar->remove_node( 'wp-logo' );
	}

	/**
	 * Add a link to the user` profile on WordPress.com
	 *
	 * @deprecated 13.7
	 *
	 * @param WP_Admin_Bar $bar The admin bar object.
	 *
	 * @return void
	 */
	protected function add_wpcom_profile_link( $bar ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::add_wpcom_profile_link' );
		$custom_node = array(
			'parent' => 'user-actions',
			'id'     => 'wpcom-profile-link',
			'title'  => __( 'WordPress.com Profile', 'jetpack' ),
			'href'   => 'https://wordpress.com/me',
			'meta'   => array(
				'title' => __( 'Go to your profile page on WordPress.com', 'jetpack' ), // Optional, tooltip text.
			),
		);

		$bar->add_node( $custom_node );
	}

	/**
	 * Remove all existing toolbar entries from core Masterbar
	 *
	 * @deprecated 13.7
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function clear_core_masterbar( $wp_admin_bar ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::clear_core_masterbar' );
		$this->masterbar_wrapper->clear_core_masterbar( $wp_admin_bar );
	}

	/**
	 * Add entries corresponding to WordPress.com Masterbar
	 *
	 * @deprecated 13.7
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function build_wpcom_masterbar( $wp_admin_bar ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::build_wpcom_masterbar' );
		$this->masterbar_wrapper->build_wpcom_masterbar( $wp_admin_bar );
	}

	/**
	 * Get WordPress.com current locale name.
	 *
	 * @deprecated 13.7
	 */
	public function get_locale() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::get_locale' );
		return $this->masterbar_wrapper->get_locale();
	}

	/**
	 * Get Jetpack locale name.
	 *
	 * @deprecated 13.7
	 *
	 * @param  string $slug Locale slug.
	 * @return string Jetpack locale.
	 */
	public function get_jetpack_locale( $slug = '' ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::get_jetpack_locale' );
		return $this->masterbar_wrapper->get_jetpack_locale( $slug );
	}

	/**
	 * Install locale if not yet available.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $locale The new locale slug.
	 */
	public function install_locale( $locale = '' ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::install_locale' );
		return $this->masterbar_wrapper->install_locale( $locale );
	}

	/**
	 * Trigger reloading of all non-default textdomains if the user just changed
	 * their locale on WordPress.com.
	 *
	 * User locale changes on WordPress.com are detected and acted upon in the
	 * constructor of this class. However, at that point, some plugins and their
	 * translations have already been loaded (including Jetpack's). If we don't
	 * reload the translations, the user will see a mix of the old and new locale's
	 * translations until the next page load.
	 *
	 * The default textdomain is not affected by this because it's always reloaded
	 * after all plugins have been loaded, in wp-settings.php.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $wpcom_locale The user's detected WordPress.com locale.
	 */
	public function unload_non_default_textdomains_on_wpcom_user_locale_switch( $wpcom_locale ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::unload_non_default_textdomains_on_wpcom_user_locale_switch' );
		return $this->masterbar_wrapper->unload_non_default_textdomains_on_wpcom_user_locale_switch( $wpcom_locale );
	}

	/**
	 * Hide language dropdown on user edit form.
	 *
	 * @deprecated 13.7
	 */
	public function hide_language_dropdown() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::hide_language_dropdown' );
		$this->masterbar_wrapper->hide_language_dropdown();
	}

	/**
	 * Replace language dropdown with link to WordPress.com.
	 *
	 * @deprecated 13.7
	 */
	public function replace_language_dropdown() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::replace_language_dropdown' );
		return $this->masterbar_wrapper->replace_language_dropdown();
	}

	/**
	 * Add the Notifications menu item.
	 *
	 * @deprecated 13.7
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function add_notifications( $wp_admin_bar ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::add_notifications' );
		$this->masterbar_wrapper->add_notifications( $wp_admin_bar );
	}

	/**
	 * Add the "Reader" menu item in the root default group.
	 *
	 * @deprecated 13.7
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function add_reader_submenu( $wp_admin_bar ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::add_reader_submenu' );
		$this->masterbar_wrapper->add_reader_submenu( $wp_admin_bar );
	}

	/**
	 * Merge 2 menu items together into 2 link tags.
	 *
	 * @deprecated 13.7
	 *
	 * @param array $primary   Array of menu information.
	 * @param array $secondary Array of menu information.
	 */
	public function create_menu_item_pair( $primary, $secondary ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::create_menu_item_pair' );
		return $this->masterbar_wrapper->create_menu_item_pair( $primary, $secondary );
	}

	/**
	 * Create a link tag based on information about a menu item.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $class Menu item CSS class.
	 * @param string $url   URL you go to when clicking on the menu item.
	 * @param string $label Menu item title.
	 * @param string $id    Menu item slug.
	 */
	public function create_menu_item_anchor( $class, $url, $label, $id ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::create_menu_item_anchor' );
		return $this->masterbar_wrapper->create_menu_item_anchor( $class, $url, $label, $id );
	}

	/**
	 * Add Secondary groups for submenu items.
	 *
	 * @deprecated 13.7
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function wpcom_adminbar_add_secondary_groups( $wp_admin_bar ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::wpcom_adminbar_add_secondary_groups' );
		$this->masterbar_wrapper->wpcom_adminbar_add_secondary_groups( $wp_admin_bar );
	}

	/**
	 * Add User info menu item.
	 *
	 * @deprecated 13.7
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function add_me_submenu( $wp_admin_bar ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::add_me_submenu' );
		$this->masterbar_wrapper->add_me_submenu( $wp_admin_bar );
	}

	/**
	 * Add Write Menu item.
	 *
	 * @deprecated 13.7
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function add_write_button( $wp_admin_bar ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::add_write_button' );
		$this->masterbar_wrapper->add_write_button( $wp_admin_bar );
	}

	/**
	 * Add the "My Site" menu item in the root default group.
	 *
	 * @deprecated 13.7
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function add_my_sites_submenu( $wp_admin_bar ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Masterbar::add_my_sites_submenu' );
		$this->masterbar_wrapper->add_my_sites_submenu( $wp_admin_bar );
	}
}
