<?php
/**
 * File for various functionality which needs to be added to Simple and Atomic
 * sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

/**
 * Returns ISO 639 conforming locale string.
 *
 * @param string $language a language tag to be converted e.g. "en_US".
 * @return string ISO 639 locale string e.g. "en"
 */
function get_iso_639_locale( $language ) {
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

/**
 * Add Woo specific options to Jetpack Sync.
 *
 * @param array $allowed_options The allowed options.
 */
function add_woo_options_to_jetpack_sync( $allowed_options ) {
	// We are not either in Simple or Atomic
	if ( ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return $allowed_options;
	}

	if ( ! ( new Automattic\Jetpack\Status\Host() )->is_woa_site() ) {
		return $allowed_options;
	}

	if ( ! is_array( $allowed_options ) ) {
		return $allowed_options;
	}

	return array_merge( $allowed_options, array( 'woocommerce_should_run_headstart_for_theme' ) );
}
add_filter( 'jetpack_sync_options_whitelist', 'add_woo_options_to_jetpack_sync', 10, 1 );
