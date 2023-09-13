<?php
/**
 * Subscriptions Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Contact_Form;

add_action( 'init', array( Contact_Form_Block::class, 'register_block' ), 9 );
