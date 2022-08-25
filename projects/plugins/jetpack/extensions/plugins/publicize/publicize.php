<?php
/**
 * Block Editor - Republicize feature.
 *
 * @package automattic/jetpack
 **/

// Populate the available extensions with republicize.
add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			$extensions,
			array(
				'republicize',
			)
		);
	}
);
