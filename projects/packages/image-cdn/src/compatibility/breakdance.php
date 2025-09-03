<?php
/**
 * Compatibility functions for the Breakdance plugin.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack-image-cdn
 */

namespace Automattic\Jetpack\Image_CDN\Compatibility;

use Automattic\Jetpack\Image_CDN\Image_CDN;

/**
 * Unless the 'Apply the_content filter to Breakdance content' option is enabled
 * in the Breakdance settings, the content will not be filtered by the_content filter.
 * This ensures that images are passed through Image CDN when it's enabled.
 *
 * @param string $content The content to filter.
 * @return string The filtered content.
 */
function use_image_cdn( $content ) {
	if ( Image_CDN::is_enabled() ) {
		$content = Image_CDN::filter_the_content( $content );
	}

	return $content;
}
add_filter( 'breakdance_singular_content', __NAMESPACE__ . '\use_image_cdn' );
