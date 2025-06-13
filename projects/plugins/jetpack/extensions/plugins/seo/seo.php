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
		if ( is_seo_disabled() ) {
			return;
		}

		\Jetpack_Gutenberg::set_availability_for_plan( 'advanced-seo' );
	}
);

/**
 * We only want to enable the SEO extension (and display SEO settings)
 * if the 'jetpack_disable_seo_tools' filter is not set to false.
 *
 * This is done on after_setup_theme to ensure that we have access to the hook
 * that is used by SEO plugins to disable the conflicting output of SEO Tools.
 */
add_action(
	'after_setup_theme',
	function () {
		if (
			! is_seo_disabled()
			/** This filter is already documented in modules/seo-tools/class-jetpack-seo-utils.php */
			&& ! apply_filters( 'jetpack_disable_seo_tools', false )
		) {
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

/**
 * SEO tools should be hidden from non-admins if the module is not active.
 *
 * @since 14.6
 *
 * @return bool
 */
function is_seo_disabled(): bool {
	return ! ( new Modules() )->is_active( 'seo-tools' ) && ! current_user_can( 'jetpack_activate_modules' );
}
