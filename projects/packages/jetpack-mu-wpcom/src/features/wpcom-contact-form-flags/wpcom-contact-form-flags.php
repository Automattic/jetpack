<?php
/**
 * WordPress.com Contact Form feature flags.
 *
 * Central Forms Management is enabled for every WordPress.com site, so nothing here
 * gates it any more. The `disable-central-forms-management` sticker is retired: it
 * was a rollback valve for the CFM rollout, and there is no longer anything to roll
 * back to. Every function below is kept and deprecated, so existing callers do not
 * fatal; none of them is wired to anything.
 *
 * With no filter on `jetpack_block_editor_feature_flags` from here, the
 * `central-form-management` flag falls through to the Forms package default, which
 * is true — see Automattic\Jetpack\Extensions\Contact_Form\Contact_Form_Block::register_central_form_management_default()
 * in `packages/forms`, which this package does not depend on.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Check if a site has a given blog sticker.
 *
 * Uses the appropriate sticker API depending on whether the site is
 * Simple (has_blog_sticker) or Atomic (wpcomsh_is_site_sticker_active).
 *
 * Served the retired gating, and has no callers left.
 *
 * @deprecated $$next-version$$ The gating it served is retired.
 *
 * @param string $sticker The sticker name to check.
 * @param int    $blog_id The blog ID to check.
 * @return bool
 */
function wpcom_forms_has_blog_sticker( $sticker, $blog_id ) {
	_deprecated_function( __FUNCTION__, 'jetpack-mu-wpcom-$$next-version$$' );

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
 * @deprecated $$next-version$$ Central Forms Management is enabled for every site.
 *
 * @param int|null $blog_id Blog ID. Unused.
 * @return bool Always true.
 */
function wpcom_is_central_forms_management_enabled( $blog_id = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature kept for existing callers.
	_deprecated_function( __FUNCTION__, 'jetpack-mu-wpcom-$$next-version$$' );

	return true;
}

/**
 * No-op kept so existing callers do not fatal.
 *
 * @deprecated $$next-version$$ Nothing disables Central Forms Management any more.
 */
function wpcom_maybe_disable_central_forms_management() {
	_deprecated_function( __FUNCTION__, 'jetpack-mu-wpcom-$$next-version$$' );
}

/**
 * Pass-through kept so existing callers do not fatal.
 *
 * Previously set the `central-form-management` block editor feature flag. No longer
 * hooked: the Forms package already defaults the flag to true, so filtering here only
 * ever restated the default.
 *
 * @deprecated $$next-version$$ The Forms package supplies the default.
 *
 * @param array $flags Existing feature flags.
 * @return array Flags, unchanged.
 */
function wpcom_contact_form_set_editor_feature_flags( $flags ) {
	_deprecated_function( __FUNCTION__, 'jetpack-mu-wpcom-$$next-version$$' );

	return $flags;
}
