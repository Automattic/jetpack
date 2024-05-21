<?php
/**
 * Variation of the Protect product that focuses on the Firewall feature.
 * i.e. Redirects the user to the Firewall settings page on purchase.
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

/**
 * Class responsible for handling the Protect "Firewall" product variation.
 */
class Protect_Firewall extends Protect {
	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'protect-firewall';

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=jetpack-protect#/firewall' );
	}
}
