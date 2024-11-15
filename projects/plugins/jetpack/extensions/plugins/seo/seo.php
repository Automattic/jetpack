<?php
/**
 * Block Editor - SEO feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Seo;

use Automattic\Jetpack\Modules;

add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		/*
		* The extension is available even when the module is not active,
		* so we can display a nudge to activate the module instead of the block.
		* However, since non-admins cannot activate modules, we do not display the empty block for them.
		*/
		if ( ! ( new Modules() )->is_active( 'seo' ) && ! current_user_can( 'jetpack_activate_modules' ) ) {
			return;
		}

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
