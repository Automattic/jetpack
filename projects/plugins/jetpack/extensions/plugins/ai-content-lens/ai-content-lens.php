<?php
/**
 * Block Editor - AI Assistant plugin feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Content_Lens;

// Feature name.
const FEATURE_NAME = 'ai-content-lens';

// Populate the available extensions with ai-content-lens.
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

// Set the ai-content-lens availability, depending on the site plan.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
);
