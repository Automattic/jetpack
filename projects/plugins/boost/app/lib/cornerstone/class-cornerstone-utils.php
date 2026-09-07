<?php

namespace Automattic\Jetpack_Boost\Lib\Cornerstone;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Cornerstone_Provider;

class Cornerstone_Utils {

	/**
	 * Get the list of cornerstone pages.
	 *
	 * @return string[] The relative URLs of all the cornerstone pages.
	 */
	public static function get_list() {
		/**
		 * Filters the list of cornerstone pages. This list includes the predefined and custom pages.
		 * If you want to change the list of custom pages, use `jetpack_boost_cornerstone_pages_list` instead.
		 *
		 * @since 4.4.0-beta1
		 *
		 * @param string[] $urls The absolute URLs of all the cornerstone pages.
		 */
		$urls = apply_filters( 'jetpack_boost_cornerstone_pages_list_complete', array_merge( self::get_predefined_list(), self::get_custom_list() ) );

		return self::dedupe_by_provider_key( $urls );
	}

	/**
	 * Dedupe a list of cornerstone URLs by their provider key.
	 *
	 * Different URL forms of the same page collapse to one provider key: the predefined
	 * home_url() and a "/" (or "") homepage entry in the custom list both hash to
	 * `cornerstone_d41d8cd9`. Keeping both produces two page entries with the same key, and
	 * LCP_State::set_pending_pages() only marks the first — leaving the duplicate without a
	 * `status`, which fails the lcp_state schema on write and silently stores the empty
	 * not_analyzed fallback. The first occurrence wins, so the predefined entry is kept.
	 *
	 * @param string[] $urls The URLs to dedupe.
	 * @return string[] The URLs with provider-key duplicates removed, re-indexed.
	 */
	private static function dedupe_by_provider_key( $urls ) {
		if ( ! is_array( $urls ) ) {
			return array();
		}

		$seen    = array();
		$deduped = array();
		foreach ( $urls as $url ) {
			$key = self::get_provider_key( $url );
			if ( isset( $seen[ $key ] ) ) {
				continue;
			}
			$seen[ $key ] = true;
			$deduped[]    = $url;
		}

		return $deduped;
	}

	/**
	 * Gets the list of Cornerstone Pages that the user has added to the custom list.
	 *
	 * @return string[] The absolute URLs of the cornerstone pages.
	 *
	 * @since 4.2.0
	 */
	public static function get_custom_list() {
		$pages = jetpack_boost_ds_get( 'cornerstone_pages_list' );

		// Bail early if no pages are found.
		if ( empty( $pages ) ) {
			return array();
		}

		return self::maybe_trailing_slash_urls( $pages );
	}

	/**
	 * Gets the list of Cornerstone Pages that the user cannot remove.
	 *
	 * @return string[] The absolute URLs of the cornerstone pages.
	 *
	 * @since 4.2.0
	 */
	public static function get_predefined_list() {
		return self::maybe_trailing_slash_urls( array( home_url() ) );
	}

	/**
	 * Checks if a URL is a cornerstone page.
	 *
	 * @param string $url The URL to check.
	 * @return bool True if the URL is a cornerstone page, false otherwise.
	 */
	public static function is_cornerstone_page_by_url( $url ) {
		$cornerstone_pages = self::get_list();
		if ( empty( $cornerstone_pages ) ) {
			return false;
		}

		$cornerstone_pages = array_map( 'untrailingslashit', $cornerstone_pages );
		return in_array( self::sanitize_url( $url ), $cornerstone_pages, true );
	}

	/**
	 * Sanitize a URL to make it a compatible cornerstone page URL.
	 *
	 * @param string $url The URL to sanitize.
	 * @return string The sanitized URL.
	 */
	public static function sanitize_url( $url ) {
		return untrailingslashit( $url );
	}

	/**
	 * Get the provider key for a given URL.
	 *
	 * @param string $url The URL to get the provider key for.
	 * @return string The provider key.
	 */
	public static function get_provider_key( $url ) {
		return Cornerstone_Provider::get_provider_key( self::sanitize_url( $url ) );
	}

	/**
	 * Prepare provider data for a given URL.
	 * This is usually sent to the Cloud API.
	 *
	 * @param string $url The URL to prepare provider data for.
	 * @return array The provider data.
	 */
	public static function prepare_provider_data( $url ) {
		return array(
			'key' => self::get_provider_key( $url ),
			// Send the URL verbatim (do not sanitize/untrailingslashit it). The cloud analyzer
			// fetches this exact URL, so it must keep the site's canonical trailing-slash form to
			// avoid edge/WAF 301s or 403s that break analysis. The `key` is intentionally still
			// stripped so storage/retrieval stays slash-agnostic. Do not "simplify" url back to
			// self::sanitize_url( $url ).
			'url' => $url,
		);
	}

	/**
	 * Checks if the current page is a cornerstone page.
	 *
	 * @return bool True if the current page is a cornerstone page, false otherwise.
	 *
	 * @since 3.13.1
	 */
	public static function is_current_page_cornerstone() {
		return self::is_cornerstone_page_by_url( Cornerstone_Provider::get_request_url() );
	}

	/**
	 * Check if a post ID is a cornerstone page.
	 *
	 * @param int $post_id The ID of the post to check.
	 * @return bool True if the post is a cornerstone page, false otherwise.
	 */
	public static function is_cornerstone_page( $post_id ) {
		return self::is_cornerstone_page_by_url( get_permalink( $post_id ) );
	}

	/**
	 * Adds trailing slashes to URLs if the current permalink structure requires it.
	 *
	 * @param string[] $urls The URLs to process.
	 * @return string[] The processed URLs.
	 */
	public static function maybe_trailing_slash_urls( $urls ) {
		$permalink_structure = \get_option( 'permalink_structure' );

		// If permalink structure ends with slash, add trailing slashes.
		if ( $permalink_structure && substr( $permalink_structure, -1 ) === '/' ) {
			$urls = array_map( 'trailingslashit', $urls );
		}

		return $urls;
	}
}
