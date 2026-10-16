<?php
/**
 * Names of the Jetpack blocks the package works with.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes;

/**
 * Block type names for the Sharing Buttons and Like blocks, which the Jetpack plugin registers.
 *
 * @since $$next-version$$
 */
final class Block_Names {

	public const SHARING_BUTTONS = 'jetpack/sharing-buttons';
	public const SHARING_BUTTON  = 'jetpack/sharing-button';
	public const LIKE            = 'jetpack/like';
}
