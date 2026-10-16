<?php
/**
 * Expiry_Domain: the WordPress.com address a reverted site falls back to.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Constants;

require_once __DIR__ . '/class-expiry-wpcom.php';

/**
 * Resolves the domain the expiry modal names, or null when it should say nothing.
 */
class Expiry_Domain {

	const CACHE_KEY = 'wpcom_expiry_notices_revert_domain';

	/**
	 * The WordPress.com address this site would fall back to, or null when the
	 * modal should leave the domain out.
	 *
	 * Null covers both a domain that survives the revert and a lookup that
	 * failed: naming the wrong one is worse than naming none.
	 */
	public static function get_revert_domain(): ?string {
		// A reverted site is back on Simple, where the blogs table already
		// holds the unmapped address and no blog token could ask for it.
		if ( Constants::is_true( 'IS_WPCOM' ) ) {
			return self::simple_revert_domain();
		}

		// A resolved "nothing to say" is remembered as '' so the common case,
		// a site keeping its custom domain, isn't re-asked every pageview.
		$domain = Expiry_Wpcom::remember(
			self::CACHE_KEY,
			static function (): ?string {
				$body = Expiry_Wpcom::get_as_blog( '/sites/%d/domains' );
				if ( ! is_object( $body ) || ! isset( $body->domains ) || ! is_array( $body->domains ) ) {
					return null;
				}
				return self::pick_revert_domain( $body->domains ) ?? '';
			}
		);

		return '' === $domain ? null : $domain;
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
	 * The fallback address out of a site's domain list, or null when the
	 * primary domain survives the revert.
	 *
	 * @param array<int,object> $domains Domain objects from /sites/{id}/domains.
	 */
	public static function pick_revert_domain( array $domains ): ?string {
		$wpcom_domain              = null;
		$primary                   = null;
		$primary_is_wpcom_provided = false;

		foreach ( $domains as $domain ) {
			if ( empty( $domain->domain ) || ! is_string( $domain->domain ) ) {
				continue;
			}

			// `*.wpcomstaging.com` is an Atomic hosting artifact whose mapping
			// the revert deletes, so it is never what the site ends up called.
			if ( ! empty( $domain->wpcom_domain ) && empty( $domain->is_wpcom_staging_domain ) ) {
				$wpcom_domain = $domain->domain;
			}

			if ( ! empty( $domain->primary_domain ) ) {
				$primary                   = $domain->domain;
				$primary_is_wpcom_provided = ! empty( $domain->wpcom_domain ) || ! empty( $domain->is_wpcom_staging_domain );
			}
		}

		if ( null === $wpcom_domain || null === $primary ) {
			return null;
		}

		return $primary_is_wpcom_provided ? $wpcom_domain : null;
	}
}
