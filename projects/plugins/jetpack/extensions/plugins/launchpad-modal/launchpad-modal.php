<?php
/**
 * Block Editor - Launchpad Modal.
 *
 * @package automattic/jetpack
 **/

// Populate the available extensions with launchpad-modal.
add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			$extensions,
			array(
				'launchpad-modal',
			)
		);
	}
);

// Set the launchpad-modal availability, depending on the site plan.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_availability_for_plan( 'launchpad-modal' );
	}
);
