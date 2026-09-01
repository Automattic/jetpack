<?php
/**
 * Simple Payments module loader.
 *
 * This file is not a typical module; the file is required from module-extras.php and thus always required
 * when the site is connected to WordPress.com. See $connected_tools in module-extras.php.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Paypal_Payments\Simple_Payments;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

Simple_Payments::get_instance();
