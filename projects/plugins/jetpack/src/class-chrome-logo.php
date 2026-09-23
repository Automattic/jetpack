<?php
/**
 * The Jetpack logo mark shared by the admin chrome.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

/**
 * Renders the green Jetpack mark used by the admin masthead and footers.
 *
 * In `src/` rather than on `Jetpack_Admin_Page` for the reason `Footer_Links` documents.
 */
class Chrome_Logo {

	/**
	 * Render the green Jetpack mark.
	 *
	 * Pass a label only where the mark is the element's accessible name. Beside visible
	 * "Jetpack" text it is decorative, and a second announcement is noise.
	 *
	 * @since $$next-version$$
	 *
	 * @param int    $height Pixel height.
	 * @param string $class  Optional class attribute.
	 * @param string $label  Optional accessible name. Empty renders the mark as decorative.
	 * @return string SVG markup.
	 */
	public static function render( $height, $class = '', $label = '' ) {
		$attributes = ' height="' . (int) $height . '"';

		if ( '' !== $class ) {
			$attributes .= ' class="' . esc_attr( $class ) . '"';
		}

		$attributes .= '' !== $label
			? ' role="img" aria-label="' . esc_attr( $label ) . '"'
			: ' aria-hidden="true"';

		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"' . $attributes . '><path fill="#069e08" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"></path></svg>';
	}
}
