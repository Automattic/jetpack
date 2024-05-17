<?php
/**
 * Social Previews plugin.
 *
 * @since 8.x
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Social_Previews;

const FEATURE_NAME = 'social-previews';

// Populate the available extensions with Social Previews.
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

// Set the Social Previews availability, depending on the site plan.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
);
