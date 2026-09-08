<?php
/**
 * Expiry_Domain: the WordPress.com address a reverted site falls back to.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Constants;

/**
 * Resolves the domain the expiry modal names, or null when it should say nothing.
 */
class Expiry_Domain {

	const CACHE_KEY = 'wpcom_expiry_notices_revert_domain';
	const CACHE_TTL = 12 * HOUR_IN_SECONDS;

	// A request that never got an answer is not an answer. Cached only long
	// enough to stop an outage being re-tried on every admin pageview, where
	// CACHE_TTL would drop the domain line for half a day over one blip.
	const FAILURE_TTL = 5 * MINUTE_IN_SECONDS;

	// Stored in place of a domain so a resolved "there is nothing to say here"
	// is cached too. Without it the common case -- a site keeping its custom
	// domain -- would re-request the domain list on every admin pageview.
	const NONE = 'none';

	/**
	 * The WordPress.com address this site would fall back to, or null when the
	 * modal should leave the domain out.
	 *
	 * Null covers both a domain that survives the revert and a lookup that
	 * failed: naming the wrong one is worse than naming none.
	 */
	public static function get_revert_domain(): ?string {
		// A reverted site is back on Simple, where the blogs table holds the
		// unmapped address outright. Nothing to ask WordPress.com for -- and
		// nothing that could ask it, since the blog token the endpoint accepts
		// belongs to Jetpack-connected sites.
		if ( Constants::is_true( 'IS_WPCOM' ) ) {
			return self::simple_revert_domain();
		}

		$cached = get_transient( self::CACHE_KEY );
		if ( is_string( $cached ) && '' !== $cached ) {
			return self::NONE === $cached ? null : $cached;
		}

		$domains = self::request_domains();
		if ( null === $domains ) {
			set_transient( self::CACHE_KEY, self::NONE, self::FAILURE_TTL );
			return null;
		}

		$domain = self::pick_revert_domain( $domains );
		set_transient( self::CACHE_KEY, $domain ?? self::NONE, self::CACHE_TTL );

		return $domain;
	}

	/**
	 * The address a reverted Simple site is now on, or null if it kept its own.
	 *
	 * `wp_blogs.domain` is the unmapped address, so serving from it means the
	 * switch has happened; a custom domain means it never did.
	 */
	private static function simple_revert_domain(): ?string {
		if ( ! function_exists( 'get_blog_details' ) ) {
			return null;
		}

		$details  = get_blog_details( get_current_blog_id() );
		$unmapped = ( is_object( $details ) && ! empty( $details->domain ) ) ? (string) $details->domain : '';
		if ( '' === $unmapped ) {
			return null;
		}

		$serving = (string) wp_parse_url( home_url(), PHP_URL_HOST );
		return $serving === $unmapped ? $unmapped : null;
	}

	/**
	 * Pure: pick the fallback address out of a site's domain list.
	 *
	 * The revert keeps a custom primary domain and only repoints it, so a site
	 * with one is never renamed and gets nothing.
	 *
	 * @param array<int,object> $domains Domain objects from /sites/{id}/domains.
	 * @return string|null
	 */
	public static function pick_revert_domain( array $domains ): ?string {
		$wpcom_domain = null;
		$primary      = null;
		$is_assigned  = false;

		foreach ( $domains as $domain ) {
			if ( empty( $domain->domain ) || ! is_string( $domain->domain ) ) {
				continue;
			}

			// The unmapped address, which wpcom synthesizes into every domain
			// list. Staging is excluded on purpose: `*.wpcomstaging.com` is an
			// Atomic hosting artifact and the revert deletes its mapping, so it
			// is never what the site ends up called.
			if ( ! empty( $domain->wpcom_domain ) && empty( $domain->is_wpcom_staging_domain ) ) {
				$wpcom_domain = $domain->domain;
			}

			if ( ! empty( $domain->primary_domain ) ) {
				$primary     = $domain->domain;
				$is_assigned = ! empty( $domain->wpcom_domain ) || ! empty( $domain->is_wpcom_staging_domain );
			}
		}

		if ( null === $wpcom_domain || null === $primary ) {
			return null;
		}

		return $is_assigned ? $wpcom_domain : null;
	}

	/**
	 * Fetch the site's domains from WordPress.com.
	 *
	 * Version 1.2 of this endpoint accepts a site's own blog token, which is what
	 * makes it answerable from Atomic at all.
	 *
	 * @return array<int,object>|null Null on any failure.
	 */
	private static function request_domains(): ?array {
		if ( ! class_exists( '\Jetpack_Options' ) || ! class_exists( Client::class ) ) {
			return null;
		}

		$site_id = \Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return null;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/domains', (int) $site_id ),
			'1.2',
			array(
				'method'  => 'GET',
				// This runs during an admin page load, so a slow answer must not
				// become a slow dashboard. Failing here just omits the domain line.
				'timeout' => 5,
			),
			null,
			'rest'
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ) );
		if ( ! isset( $body->domains ) || ! is_array( $body->domains ) ) {
			return null;
		}

		return $body->domains;
	}
}
