<?php
/**
 * Simple Payments module loader.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Paypal_Payments\Simple_Payments;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

Simple_Payments::get_instance();
