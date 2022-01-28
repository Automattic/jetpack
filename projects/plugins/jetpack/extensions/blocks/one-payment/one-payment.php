<?php
/**
 * OnePayments Block.
 *
 * One payments block to introduce them all, one payments block to find them,
 * one payments block to bring them all and in gutenberg present them really pleasently.
 *
 * @since 10.x
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\OnePayment;

use Automattic\Jetpack\Blocks;

const FEATURE_NAME = 'one-payment';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block( BLOCK_NAME );
}
add_action( 'init', __NAMESPACE__ . '\register_block' );
