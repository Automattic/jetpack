<?php
/**
 * Atomic Admin Menu file.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_once __DIR__ . '/class-admin-menu.php';

/**
 * Class Atomic_Admin_Menu_Wpadmin
 *
 * This class makes modifications to the admin menu for Atomic sites that have
 * set the wpcom_admin_interface option to 'wp-admin'.
 *
 * With this option, users can indicate that they wish to NOT use the Calypso interface for managing their site.
 * Not all pages are available in wp-admin and this class makes sure that we still add or change pages for which
 * we have no suitable page in wp-admin.
 */
class Atomic_Admin_Menu_Wpadmin extends Atomic_Admin_Menu {

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		// Remove separators.
		remove_menu_page( 'separator1' );
		$this->add_upgrades_menu();
		$this->add_testimonials_menu();
		$this->add_portfolio_menu();
		$this->add_tools_menu();
		$this->add_options_menu();
		$this->add_jetpack_menu();

		// Remove Links Manager menu since its usage is discouraged. https://github.com/Automattic/wp-calypso/issues/51188.
		// @see https://core.trac.wordpress.org/ticket/21307#comment:73.
		if ( $this->should_disable_links_manager() ) {
			remove_menu_page( 'link-manager.php' );
		}

		ksort( $GLOBALS['menu'] );
	}
}
