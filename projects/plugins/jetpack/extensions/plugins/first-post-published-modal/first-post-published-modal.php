<?php
/**
 * First Post Published Save Modal
 *
 * @since 11.7
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\FirstPostPublishedModal;

// Feature name.
const FEATURE_NAME = 'first-post-published-modal';

// Populate the available extensions with first-post-published-modal.
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

// Set the first-post-published-modal availability.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
);
