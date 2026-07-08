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

/*
 * Register the block as a fallback when loaded via the Blocks module.
 *
 * The Forms package registers this block when the Forms (contact-form) module is active.
 * When only the Blocks module is active, this ensures the block is still registered so
 * admins see a nudge to activate the Forms module.
 *
 * Contact_Form_Block::register_block() calls can_manage_block() internally,
 * and Blocks::jetpack_register_block() is a no-op if the block is already registered,
 * so double-registration is not possible.
 */
add_action( 'init', array( Contact_Form_Block::class, 'register_block' ), 9 );
