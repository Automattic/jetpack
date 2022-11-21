<?php
/**
 * Block Editor - Test Plugin feature.
 *
 * @package automattic/jetpack
 */

// Feature name.
const FEATURE_NAME = 'test-plugin';

// Populate the available extensions with test-plugin.
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

// Set the test-plugin availability, depending on the site plan.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
);

echo("<script>console.log('test-plugin/test-plugin.php')</script>");
