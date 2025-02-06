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
	}
);

add_action(
	'after_setup_theme',
	function () {
		// We only want to enable the SEO extension (and display SEO settings) if the 'jetpack_disable_seo_tools' filter is not set to false.
		if ( ! apply_filters( 'jetpack_disable_seo_tools', false ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'jetpack-seo' );
		}
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
