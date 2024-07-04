<?php
/**
 * P2 Admin Menu file.
 *
 * @deprecated $$next-version$$ Use Automattic\Jetpack\Masterbar\P2_Admin_Menu instead.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\P2_Admin_Menu as Masterbar_P2_Admin_Menu;

/**
 * Class P2_Admin_Menu.
 */
class P2_Admin_Menu extends Masterbar_P2_Admin_Menu {

	/**
	 * Ensure that instantiating this class will trigger a deprecation warning.
	 *
	 * @since $$next-version$$
	 */
	public function __construct() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\P2_Admin_Menu::__construct' );
		parent::__construct();
	}

	/**
	 * Create the desired menu output.
	 *
	 * @deprecated $$next-version$$
	 */
	public function reregister_menu_items() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\P2_Admin_Menu::reregister_menu_items' );
		parent::reregister_menu_items();
	}

	/**
	 * Override, don't add the woocommerce installation menu on any p2s.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param array|null $current_plan The site's plan.
	 */
	public function add_woocommerce_installation_menu( $current_plan = null ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\P2_Admin_Menu::add_woocommerce_installation_menu' );
		parent::add_woocommerce_installation_menu( $current_plan );
	}
}
