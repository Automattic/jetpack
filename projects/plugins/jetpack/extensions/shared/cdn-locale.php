<?php
/**
 * Shared locale helper for extensions that load assets from widgets.wp.com.
 *
 * Used by CDN-based loaders (Image Studio, AI Sidebar) that need to map the
 * current user's WordPress locale to the ISO 639 language code used by the
 * widgets.wp.com translation files at languages/{code}-v1.js.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Shared;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Determine the ISO 639 locale code for the current user.
 *
 * Normalizes the WordPress user locale to match widgets.wp.com translation
 * file naming. Preserves region for a small set of locales where the region
 * is meaningful (pt_br, zh_tw, zh_cn); strips the region for all others;
 * falls back to 'en' when the locale is empty.
 *
 * @return string The ISO 639 language code, defaulting to 'en'.
 */
function determine_iso_639_locale(): string {
	$language = get_user_locale();
	$language = strtolower( $language );

	if ( in_array( $language, array( 'pt_br', 'pt-br', 'zh_tw', 'zh-tw', 'zh_cn', 'zh-cn' ), true ) ) {
		$language = str_replace( '_', '-', $language );
	} else {
		$language = preg_replace( '/([-_].*)$/i', '', $language );
	}

	if ( empty( $language ) ) {
		return 'en';
	}

	return $language;
}
