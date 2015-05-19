<?php
/**
 * Addons Page
 *
 * @author      WooThemes
 * @category    Admin
 * @package     WooCommerce/Admin
 * @version     2.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * WC_Admin_Addons Class
 */
class WC_Admin_Addons {

	/**
	 * Handles output of the reports page in admin.
	 */
	public static function output() {

		if ( false === ( $addons = get_transient( 'woocommerce_addons_data' ) ) ) {

			$addons_json = wp_remote_get( 'http://d3t0oesq8995hv.cloudfront.net/woocommerce-addons.json', array( 'user-agent' => 'WooCommerce Addons Page' ) );

			if ( ! is_wp_error( $addons_json ) ) {

				$addons = json_decode( wp_remote_retrieve_body( $addons_json ) );

				if ( $addons ) {
					set_transient( 'woocommerce_addons_data', $addons, WEEK_IN_SECONDS );
				}
			}
		}

		include_once( 'views/html-admin-page-addons.php' );
	}
}
