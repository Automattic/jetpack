<?php
/**
 * Block Editor - QR Post feature.
 *
 * @package automattic/jetpack
 */

// Feature name.
const FEATURE_NAME = 'launchpad-post-save-modal';

// Populate the available extensions with launchpad-post-save-modal.
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

// Set the launchpad-post-save-modal availability, depending on the site plan.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
);
