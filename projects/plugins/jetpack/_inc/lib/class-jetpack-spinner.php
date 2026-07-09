<?php
/**
 * Jetpack Spinner Helper
 *
 * Provides a standardized loading spinner SVG that visually matches
 * the WordPress Core Spinner (@wordpress/components Spinner).
 *
 * For React/JS editor and admin contexts, use:
 *   import { Spinner } from '@wordpress/components';
 *
 * For PHP wp-admin contexts, use:
 *   <span class="spinner is-active"></span>
 *
 * For frontend contexts where wp-admin CSS is unavailable, use this helper:
 *   Jetpack_Spinner::render();
 *
 * @package automattic/jetpack
 * @since 15.8
 */

/**
 * Renders an inline SVG spinner matching the WordPress Core visual.
 */
class Jetpack_Spinner {

	/**
	 * Returns the SVG markup for a spinner matching the WP Core Spinner visual:
	 * a gray circle track with a rotating quarter-arc indicator.
	 *
	 * Uses <animateTransform> for CSS-free animation, making it safe for
	 * frontend contexts where wp-admin styles are not enqueued.
	 *
	 * @since 15.8
	 *
	 * @param int $size Width and height in pixels. Default 24.
	 * @return string SVG markup.
	 */
	public static function render( $size = 24 ) {
		return sprintf(
			'<svg class="jetpack-spinner" width="%1$d" height="%1$d" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
			. '<circle cx="50" cy="50" r="46" fill="none" stroke="#ddd" stroke-width="8"/>'
			. '<path d="M 50 4 A 46 46 0 0 1 96 50" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round">'
			. '<animateTransform attributeName="transform" type="rotate" dur="1.4s" from="0 50 50" to="360 50 50" repeatCount="indefinite"/>'
			. '</path>'
			. '</svg>',
			(int) $size
		);
	}
}
