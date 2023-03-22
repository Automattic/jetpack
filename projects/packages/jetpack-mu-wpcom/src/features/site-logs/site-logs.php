<?php
/**
 * Site Logs
 *
 * @package Automattic\Jetpack\Jetpack_Mu_Wpcom\Site_Logs
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Site_Logs;

/**
 * Jetpack adds the site logs menu to WoA sites depending on the result of the
 * jetpack_show_wpcom_site_logs_menu filter. During development only particular
 * users or sites see this menu. At launch time this filter will return true for
 * all everyone.
 *
 * @return bool true if the current user should see the site logs menu
 */
function should_show_menu() {
	return defined( 'JETPACK_SHOW_WPCOM_SITE_LOGS_MENU' ) && JETPACK_SHOW_WPCOM_SITE_LOGS_MENU;
}
add_filter( 'jetpack_show_wpcom_site_logs_menu', __NAMESPACE__ . '\should_show_menu' );
