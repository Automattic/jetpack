<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Compatibility for iOS <= 15.x
 *
 * @package automattic/jetpack-search
 */
namespace Automattic\Jetpack\Search\Compatibility;

add_filter( 'jetpack_search_classic_search_enabled', __NAMESPACE__ . '\enable_classic_search_for_unsupported_browsers', 10, 1 );

/**
 * Get the iOS version from the user agent.
 *
 * @param string $user_agent The user agent string.
 * @return null|string The iOS version, or null if not found.
 */
function get_ios_version_from_user_agent( $user_agent ) {
	preg_match( '#\((iPhone|iPad|iPod).*?OS (\d+_?\d?+_?\d?).*?\)#', $user_agent, $matches );

	if ( empty( $matches[2] ) ) {
		return null;
	}

	$version = str_replace( '_', '.', $matches[2] );
	return $version;
}

/**
 * Enable Classic Search for unsupported browsers as fallback, where Instant Search is not working.
 *
 * @param boolean $classic_search_enabled whether Classic Search is enabled.
 */
function enable_classic_search_for_unsupported_browsers( $classic_search_enabled ) {
	$ios_version = get_ios_version_from_user_agent( isset( $_SERVER['HTTP_USER_AGENT'] ) ? filter_var( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '' );
	if ( $ios_version && version_compare( $ios_version, '16.0', '<' ) ) {
		return true;
	}
	return $classic_search_enabled;
}
