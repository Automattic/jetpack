<?php
/**
 * Plugin Name: Boost E2E Image CDN helper
 * Description: Appends an image to site footer.
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Heart of Gold
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

add_filter(
	'the_content',
	function ( $content ) {
		if ( is_single() ) {
			$content .= '<p><img id="e2e-test-image" src="' . plugins_url( 'assets/e2e-image.png', __FILE__ ) . '" /></p>';
		}
		return $content;
	}
);
