<?php
/**
 * Block Editor - Republicize feature.
 *
 * @package automattic/jetpack
 **/


	// Populate the available extensions with test-plugin.
	add_filter(
		'jetpack_set_available_extensions',
		function ( $extensions ) {
			return array_merge(
				$extensions,
				array(
					'test-plugin',
				)
			);
		}
	);

	// Set the test-plugin availability, depending on the site plan.
	add_action(
		'jetpack_register_gutenberg_extensions',
		function () {
			\Jetpack_Gutenberg::set_availability_for_plan( 'test-plugin' );
		}
	);
