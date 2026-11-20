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
use WP_HTML_Tag_Processor;

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

	// save.jsx hard-codes this id, typo included; site CSS may target it, so only repeats get a new one.
	static $list_id_taken = false;
	$list_id              = 'jetpack-sharing-serivces-list';

	$list = new WP_HTML_Tag_Processor( $content );
	if ( $list->next_tag( 'ul' ) && $list_id === $list->get_attribute( 'id' ) ) {
		if ( $list_id_taken ) {
			$list->set_attribute( 'id', wp_unique_id( $list_id . '-' ) );
		}
		$list_id_taken = true;
	}

	return $list->get_updated_html();
}
