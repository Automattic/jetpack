<?php
/**
 * Block Editor - Republicize feature.
 *
 * @package automattic/jetpack
 **/


	// Populate the available extensions with launchpad-post-save-modal.
	add_filter(
		'jetpack_set_available_extensions',
		function ( $extensions ) {
			return array_merge(
				$extensions,
				array(
					'launchpad-post-save-modal',
				)
			);
		}
	);

	// Set the launchpad-post-save-modal availability, depending on the site plan.
	add_action(
		'jetpack_register_gutenberg_extensions',
		function () {
			\Jetpack_Gutenberg::set_availability_for_plan( 'launchpad-post-save-modal' );
		}
	);
