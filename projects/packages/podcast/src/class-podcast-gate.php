<?php
/**
 * Podcast product-access gate.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Status\Host;
use Jetpack_Options;

/**
 * Premium podcast feature gate.
 *
 * Resolves the paid surfaces (episode dashboard, stats, episode block) two
 * ways depending on the host:
 *
 * - WordPress.com (Simple/WoA): the `podcasting` plan feature via
 *   `Current_Plan::supports`, plus the launch-day grandfather rule. Reads
 *   request-scoped state, so callers gating a different blog must
 *   `switch_to_blog` first.
 * - Self-hosted Jetpack: the site's purchased plan over the Jetpack
 *   connection. Per PODS-123, the Growth (and Complete) plans unlock the paid
 *   surfaces; everything else is feed-only. The `/upgrades` lookup is refreshed
 *   off the render path — on the background `jetpack_heartbeat` cron and on
 *   checkout return — so access checks read a local cache (never the network)
 *   on the front end and in feeds, matching how Jetpack's own plan gating works.
 */
class Podcast_Gate {

	const FEATURE_SLUG = 'podcasting';

	/**
	 * Launch-day cutoff for the paying-blog grandfather rule. Paid blogs
	 * registered before this date keep Premium podcast features without
	 * needing the `podcasting` plan feature. WordPress.com only.
	 */
	const GRANDFATHER_CUTOFF_DATE = '2026-05-18';

	/**
	 * Transient holding the cached `/upgrades` response. Written only by
	 * `refresh_purchases_cache()` (heartbeat + checkout return + first admin
	 * load), never on the front end — access checks read it locally. The
	 * week-long TTL just bounds staleness if the heartbeat stops; a returning
	 * buyer forces a fresh read the moment they land back on the dashboard.
	 */
	const PURCHASES_TRANSIENT = 'jetpack_podcast_site_purchases';

	/**
	 * Request-scoped memo of the purchases lookup (including failures, so a
	 * failed fetch isn't retried mid-request). Null until first resolved.
	 *
	 * @var array|null
	 */
	private static $purchases_cache = null;

	/**
	 * Whether the current site can use the paid podcast surfaces.
	 *
	 * @return bool
	 */
	public static function has_product_access(): bool {
		if ( ! ( new Host() )->is_wpcom_platform() ) {
			return self::self_hosted_has_paid_plan();
		}

		$blog_id = get_current_blog_id();
		if ( $blog_id <= 0 ) {
			return false;
		}

		if ( self::is_grandfathered( $blog_id ) ) {
			return true;
		}

		return (bool) Current_Plan::supports( self::FEATURE_SLUG );
	}

	/**
	 * The minimum plan to upsell when the site lacks podcast product access.
	 *
	 * WordPress.com Premium (`value_bundle`) or Jetpack Growth
	 * (`jetpack_growth_yearly`) — the entry points to the paid podcast surfaces
	 * resolved by {@see self::has_product_access()}.
	 *
	 * @return string Plan slug used to build the editor upgrade nudge.
	 */
	public static function get_required_plan_slug(): string {
		return ( new Host() )->is_wpcom_platform() ? 'value_bundle' : 'jetpack_growth_yearly';
	}

	/**
	 * Drop the cached purchases lookup. Leaves the cache empty until the next
	 * `refresh_purchases_cache()` repopulates it.
	 */
	public static function flush_purchases_cache(): void {
		delete_transient( self::PURCHASES_TRANSIENT );
		self::$purchases_cache = null;
	}

	/**
	 * Fetch the site's current purchases from WordPress.com (`/upgrades`) and
	 * cache them. This is the only method that touches the network, so it must
	 * run off the render path — it's wired to the background `jetpack_heartbeat`
	 * cron and called on checkout return, keeping the (blocking) request out of
	 * front-end and feed rendering, where `has_product_access()` reads only the
	 * cache written here.
	 *
	 * Fails closed: an unreachable or malformed response is left uncached so the
	 * next refresh retries rather than persisting a stale empty result. No-op on
	 * WordPress.com, which gates via `Current_Plan` instead of purchases.
	 */
	public static function refresh_purchases_cache(): void {
		if ( ( new Host() )->is_wpcom_platform() ) {
			return;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/upgrades?site=%d', (int) Jetpack_Options::get_option( 'id' ) ),
			'1.2',
			array( 'method' => 'GET' )
		);

		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return;
		}

		$decoded = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $decoded ) ) {
			return;
		}

		set_transient( self::PURCHASES_TRANSIENT, $decoded, WEEK_IN_SECONDS );
		self::$purchases_cache = $decoded;
	}

	/**
	 * Warm the purchases cache if it hasn't been populated yet. Called from the
	 * podcast dashboard (an admin request) so a paying site sees the right state
	 * even before the first heartbeat runs, without ever fetching on the front
	 * end. A cached empty array counts as populated and is left untouched.
	 */
	public static function prime_purchases_cache(): void {
		if ( false === get_transient( self::PURCHASES_TRANSIENT ) ) {
			self::refresh_purchases_cache();
		}
	}

	/**
	 * Whether a self-hosted Jetpack site owns a Growth (or Complete) plan.
	 *
	 * Mirrors the bundle-detection pattern used by My Jetpack's Growth/Security
	 * products: match purchased product slugs rather than the `podcasting`
	 * feature, which maps to all Jetpack sites on WordPress.com and so can't
	 * distinguish free from paid here.
	 */
	private static function self_hosted_has_paid_plan(): bool {
		foreach ( self::get_site_current_purchases() as $purchase ) {
			$slug = is_array( $purchase ) && isset( $purchase['product_slug'] ) ? $purchase['product_slug'] : '';

			// Growth and Complete bundles unlock the paid surfaces; matched as
			// prefixes so every billing term/tier counts.
			foreach ( array( 'jetpack_growth', 'jetpack_complete' ) as $prefix ) {
				if ( is_string( $slug ) && 0 === strpos( $slug, $prefix ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * The site's current purchases, read from the local cache only — never the
	 * network. Populated off the render path by `refresh_purchases_cache()`; an
	 * unwarmed cache reads as no purchases (fails closed to the basic player).
	 *
	 * @return array List of purchase entries (associative arrays); empty when uncached.
	 */
	private static function get_site_current_purchases(): array {
		if ( null !== self::$purchases_cache ) {
			return self::$purchases_cache;
		}

		$cached                = get_transient( self::PURCHASES_TRANSIENT );
		self::$purchases_cache = is_array( $cached ) ? $cached : array();
		return self::$purchases_cache;
	}

	/**
	 * Whether the blog is grandfathered: registered before the cutoff AND on a paid plan.
	 *
	 * @param int $blog_id Blog ID.
	 */
	protected static function is_grandfathered( int $blog_id ): bool {
		if ( ! function_exists( 'get_blog_details' ) ) {
			return false;
		}
		$details = get_blog_details( $blog_id );
		if ( ! $details || empty( $details->registered ) ) {
			return false;
		}
		$registered_ts = strtotime( $details->registered );
		if ( false === $registered_ts || $registered_ts >= strtotime( self::GRANDFATHER_CUTOFF_DATE ) ) {
			return false;
		}

		$plan = Current_Plan::get();
		return ! empty( $plan['class'] ) && 'free' !== $plan['class'];
	}
}
