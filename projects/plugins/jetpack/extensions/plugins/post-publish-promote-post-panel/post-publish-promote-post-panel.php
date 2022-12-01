<?php
/**
 * Block Editor - BlazePress Promote feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\PromotePosts;

// Feature name.
const FEATURE_NAME = 'post-publish-promote-post-panel';

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

// Set the  post-publish-promote-post-panel availability, depending on the site plan.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
);
