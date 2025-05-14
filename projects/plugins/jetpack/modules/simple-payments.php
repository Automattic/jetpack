<?php
/**
 * Simple Payments module loader.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Paypal_Payments\Jetpack_Simple_Payments;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

Jetpack_Simple_Payments::get_instance();
