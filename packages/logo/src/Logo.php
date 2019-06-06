<?php
/**
 * A logo for Jetpack.
 *
 * @package jetpack-logo
 */

namespace Automattic\Jetpack\Assets;

/**
 * Jetpack logo as SVG shapes.
 *
 * Initializes the logo property with a string describing the Jetpack logo.
 * The Jetpack logo SVG string includes CSS classes to stylize it:
 * - jetpack-logo: the wrapper <svg> tag.
 * - jetpack-logo__icon-circle: the circle of the Jetpack mark.
 * - jetpack-logo__icon-triangle: two shapes that correspond to each triangle in the Jetpack mark.
 * - jetpack-logo__icon-text: the Jetpack lettering.
 *
 * @var string
 */
const JETPACK_LOGO_SVG = <<<'EOSVG'
<svg xmlns="http://www.w3.org/2000/svg" height="32" class="jetpack-logo" viewBox="0 0 118 32">
	<path class="jetpack-logo__icon-circle" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z" fill="#00be28" />
	<polygon class="jetpack-logo__icon-triangle" points="15,19 7,19 15,3" fill="#fff" />
	<polygon class="jetpack-logo__icon-triangle" points="17,29 17,13 25,13" fill="#fff" />
	<path class="jetpack-logo__text" d="M41.3 26.6c-.5-.7-.9-1.4-1.3-2.1 2.3-1.4 3-2.5 3-4.6V8h-3V6h6v13.4C46 22.8 45 24.8 41.3 26.6zM58.5 21.3c-1.5.5-2.7.6-4.2.6-3.6 0-5.8-1.8-5.8-6 0-3.1 1.9-5.9 5.5-5.9s4.9 2.5 4.9 4.9c0 .8 0 1.5-.1 2h-7.3c.1 2.5 1.5 2.8 3.6 2.8 1.1 0 2.2-.3 3.4-.7C58.5 19 58.5 21.3 58.5 21.3zM56 15c0-1.4-.5-2.9-2-2.9-1.4 0-2.3 1.3-2.4 2.9C51.6 15 56 15 56 15zM65 18.4c0 1.1.8 1.3 1.4 1.3.5 0 2-.2 2.6-.4v2.1c-.9.3-2.5.5-3.7.5-1.5 0-3.2-.5-3.2-3.1V12H60v-2h2.1V7.1H65V10h4v2h-4V18.4zM71 10h3v1.3c1.1-.8 1.9-1.3 3.3-1.3 2.5 0 4.5 1.8 4.5 5.6s-2.2 6.3-5.8 6.3c-.9 0-1.3-.1-2-.3V28h-3V10zM76.5 12.3c-.8 0-1.6.4-2.5 1.2v5.9c.6.1.9.2 1.8.2 2 0 3.2-1.3 3.2-3.9C79 13.4 78.1 12.3 76.5 12.3zM93 22h-3v-1.5c-.9.7-1.9 1.5-3.5 1.5-1.5 0-3.1-1.1-3.1-3.2 0-2.9 2.5-3.4 4.2-3.7l2.4-.3v-.3c0-1.5-.5-2.3-2-2.3-.7 0-2.3.5-3.7 1.1L84 11c1.2-.4 3-1 4.4-1 2.7 0 4.6 1.4 4.6 4.7L93 22zM90 16.4l-2.2.4c-.7.1-1.4.5-1.4 1.6 0 .9.5 1.4 1.3 1.4s1.5-.5 2.3-1V16.4zM104.5 21.3c-1.1.4-2.2.6-3.5.6-4.2 0-5.9-2.4-5.9-5.9 0-3.7 2.3-6 6.1-6 1.4 0 2.3.2 3.2.5V13c-.8-.3-2-.6-3.2-.6-1.7 0-3.2.9-3.2 3.6 0 2.9 1.5 3.8 3.3 3.8.9 0 1.9-.2 3.2-.7V21.3zM110 15.2c.2-.3.2-.8 3.8-5.2h3.7l-4.6 5.7 5 6.3h-3.7l-4.2-5.8V22h-3V6h3V15.2z" />
</svg>
EOSVG;

/**
 * Create and render a Jetpack logo.
 */
class Logo {

	/**
	 * Return the Jetpack logo.
	 *
	 * @return string The Jetpack logo.
	 */
	public function render() {
		return JETPACK_LOGO_SVG;
	}
}
