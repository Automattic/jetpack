<?php
/**
 * Pocket Casts Block.
 *
 * @since 12.9
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Pocket_Casts;

use Jetpack_Gutenberg;

/**
 * Enables the non-block Pocket Casts extension so it would load on the editor.
 */
function set_pocketcasts_extension_available() {
	Jetpack_Gutenberg::set_extension_available( 'jetpack/pocketcasts' );
}

add_action( 'init', __NAMESPACE__ . '\set_pocketcasts_extension_available' );
