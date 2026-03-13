<?php
/**
 * Contact Form Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Contact_Form;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Register the block
add_action( 'init', array( Contact_Form_Block::class, 'register_block' ), 9 );
