<?php
/**
 * Atomic modifications for Jetpack's SEO Tools.
 *
 * @package wpcomsh
 */

/**
 * Enable a Meta Description block in the post editor's sidebar.
 */
function wpcomsh_enable_seo_description_editor() {
	if (
		! class_exists( 'Jetpack' )
		|| ! Jetpack::is_active()
		|| ! Jetpack::is_module_active( 'seo-tools' )
		|| ! class_exists( 'Jetpack_SEO_Posts' )
	) {
		return;
	}

	Jetpack_SEO_Posts::register_post_meta();
	Jetpack_SEO_Posts::register_gutenberg_extension();
}
add_action( 'init', 'wpcomsh_enable_seo_description_editor' );

