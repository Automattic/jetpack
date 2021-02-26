<?php
/**
 * Deprecated since 8.3.0
 *
 * Originally we created the mobile theme feature as a fall-back
 * when the regular theme did not include a mobile view.
 * Most themes include a mobile view by default now, so the feature is no longer necessary.
 *
 * Visit this page for some alternatives:
 * https://jetpack.com/support/mobile-theme/
 *
 * If you MUST continue to use this module, you can use this standalone plugin as a temporary solution:
 * https://github.com/Automattic/minileven
 * However, we do not recommend it.
 *
 * @deprecated
 * @package automattic/jetpack
 */

/**
 * Deactivate module if it is still active.
 *
 * @since 8.3.0
 */
if ( Jetpack::is_module_active( 'minileven' ) ) {
	Jetpack::deactivate_module( 'minileven' );
}

// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
_deprecated_file( basename( __FILE__ ), 'jetpack-8.3.0' );

/**
 * Check if we are on mobile.
 */
function jetpack_check_mobile() {
	_deprecated_function( __FUNCTION__, 'jetpack-8.3.0', 'jetpack_is_mobile' );

	return jetpack_is_mobile();
}

/**
 * Should exclude from mobile?
 */
function jetpack_mobile_exclude() {
	_deprecated_function( __FUNCTION__, 'jetpack-8.3.0' );
}

/**
 * Setup function for the Mobile theme.
 * Can be overwritten in child themes.
 */
function minileven_setup() {
	_deprecated_function( __FUNCTION__, 'jetpack-8.3.0' );
}
