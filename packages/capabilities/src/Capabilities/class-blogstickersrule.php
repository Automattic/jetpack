<?php
/**
 * Requires that the current blog has at least one of the listed stickers
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

class BlogStickersRule implements Rule {
	public function __construct( $stickers ) {
		$this->stickers = $stickers;
	}
	public function check( ...$args ) {
		return has_any_blog_stickers( $this->stickers, get_current_blog_id() ) ?
			new PermissionGranted() :
			new PermissionDenied(
				sprintf( __( 'Missing required blog sticker', 'jetpack' ) )
			);
	}
}
