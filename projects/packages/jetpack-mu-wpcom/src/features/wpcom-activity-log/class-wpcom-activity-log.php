<?php
/**
 * The WordPress.com view of the Activity Log product.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Reports Activity Log as active on WordPress.com.
 *
 * WordPress.com serves the Activity Log from Calypso and links to it from the Jetpack menu
 * whatever the module says, so the module state is the wrong thing for the My Jetpack card
 * to report. Only the card is affected: the module itself is left alone.
 *
 * My Jetpack is the only caller — it resolves this class through `my_jetpack_products_classes`
 * — so the parent is always loaded by the time the autoloader reaches this file.
 */
class Wpcom_Activity_Log extends \Automattic\Jetpack\My_Jetpack\Products\Activity_Log {

	/**
	 * Whether the site has the Activity Log.
	 *
	 * @return bool
	 */
	public static function is_module_active() {
		return true;
	}
}
