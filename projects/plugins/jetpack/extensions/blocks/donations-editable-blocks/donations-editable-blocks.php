<?php
/**
 * New donations Block.
 *
 * @since   8.x
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Donations_Editable;

use Automattic\Jetpack\Blocks;

require_once __DIR__ . '/child-blocks/one-time-view/one-time-view.php';
require_once __DIR__ . '/child-blocks/monthly-view/monthly-view.php';
require_once __DIR__ . '/child-blocks/annual-view/annual-view.php';
require_once __DIR__ . '/child-blocks/amount/amount.php';

const BLOCK_NAME = 'donations-editable-blocks';
/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block( BLOCK_NAME );
}

add_action( 'init', __NAMESPACE__ . '\register_block' );

