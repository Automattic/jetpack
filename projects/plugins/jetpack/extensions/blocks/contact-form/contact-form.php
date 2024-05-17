<?php
/**
 * Contact Form Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Contact_Form;

add_action( 'init', array( Contact_Form_Block::class, 'register_block' ), 9 );

add_action( 'enqueue_block_editor_assets', array( Contact_Form_Block::class, 'load_editor_scripts' ), 9 );
