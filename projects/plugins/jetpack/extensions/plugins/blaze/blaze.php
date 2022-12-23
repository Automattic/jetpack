<?php
/**
 * Block Editor - BlazePress Promote feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Blaze;

// Feature name.
const FEATURE_NAME = 'blaze';

add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			$extensions,
			array(
				FEATURE_NAME,
			)
		);
	}
);

// Set the  blaze availability, depending on the site plan.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
);
