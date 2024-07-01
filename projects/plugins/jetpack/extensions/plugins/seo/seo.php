<?php
/**
 * Block Editor - SEO feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Seo;

add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_availability_for_plan( 'advanced-seo' );
		\Jetpack_Gutenberg::set_extension_available( 'jetpack-seo' );
	}
);

add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			$extensions,
			array( 'advanced-seo' )
		);
	}
);
