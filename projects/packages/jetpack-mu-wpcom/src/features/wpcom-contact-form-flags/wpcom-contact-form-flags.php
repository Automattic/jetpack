<?php
/**
 * WordPress.com Contact Form feature flags.
 *
 * Controls the Central Forms Management rollout and disables the integrations
 * tab on WordPress.com sites. Works on both Simple and Atomic infrastructure.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Check if a site has the 'central-forms-management' blog sticker.
 *
 * Uses the appropriate sticker API depending on whether the site is
 * Simple (has_blog_sticker) or Atomic (wpcomsh_is_site_sticker_active).
 *
 * @param int $blog_id The blog ID to check.
 * @return bool
 */
function wpcom_has_central_forms_management_sticker( $blog_id ) {
	$sticker = 'central-forms-management';

	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC && function_exists( 'wpcomsh_is_site_sticker_active' ) ) {
		return (bool) wpcomsh_is_site_sticker_active( $sticker );
	} elseif ( function_exists( 'has_blog_sticker' ) ) {
		return (bool) has_blog_sticker( $sticker, $blog_id );
	}

	return false;
}

/**
 * Check if Central Forms Management is enabled for a given blog.
 *
 * Enabled for all WordPress.com sites except e2e test sites.
 *
 * @param int|null $blog_id Blog ID. Defaults to the current WP.com blog ID.
 * @return bool
 */
function wpcom_is_central_forms_management_enabled( $blog_id = null ) {
	if ( null === $blog_id ) {
		$blog_id = function_exists( 'get_wpcom_blog_id' ) ? get_wpcom_blog_id() : get_current_blog_id();
	}

	// Exclude e2e test sites — their tests aren't ready for CFM yet.
	if ( function_exists( 'has_blog_sticker' ) && has_blog_sticker( 'a8c-e2e-test-blog', $blog_id ) ) {
		return false;
	}

	return true;
}

/**
 * Enable the Central Forms Management alpha features when the rollout
 * criteria are met. Called immediately on file load since this file is
 * required during plugins_loaded (priority 10) inside load_wpcom_sites_features(),
 * which is after the priority 1 that the wpcom mu-plugin uses.
 */
function wpcom_maybe_enable_central_forms_management() {
	if ( ! wpcom_is_central_forms_management_enabled() ) {
		return;
	}

	add_filter( 'jetpack_forms_alpha', '__return_true', 999 );
}
wpcom_maybe_enable_central_forms_management();

/**
 * Set the 'central-form-management' block editor feature flag.
 *
 * @param array $flags Existing feature flags.
 * @return array Modified feature flags.
 */
function wpcom_contact_form_set_editor_feature_flags( $flags ) {
	$flags['central-form-management'] = wpcom_is_central_forms_management_enabled();
	return $flags;
}
add_filter( 'jetpack_block_editor_feature_flags', 'wpcom_contact_form_set_editor_feature_flags', 1000 );
