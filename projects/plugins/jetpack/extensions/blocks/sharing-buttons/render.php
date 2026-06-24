<?php
/**
 * Sharing Buttons block render implementation.
 *
 * Loaded lazily from sharing-buttons.php only when the block is rendered, to keep
 * the render body out of the eager front-end PHP/opcache footprint.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Sharing_Buttons;

use Automattic\Jetpack\Status\Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Sharing Buttons block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Sharing Buttons block attributes.
 * @param string $content String containing the Sharing Buttons block content.
 *
 * @return string
 */
function render_block_implementation( $attr, $content ) {
	// Render nothing in other contexts than frontend (i.e. feed, emails, API, etc.).
	if ( ! Request::is_frontend() ) {
		return '';
	}

	return $content;
}
