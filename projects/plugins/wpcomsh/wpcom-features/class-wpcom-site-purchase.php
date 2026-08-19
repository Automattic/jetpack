<?php
/**
 * THIS FILE EXISTS VERBATIM IN WPCOM AND WPCOMSH.
 *
 * DANGER DANGER DANGER!!!
 * If you make any changes to this file you must MANUALLY update this file in both WPCOM and WPCOMSH.
 *
 * @package WPCOM_Features
 */

/**
 * A site purchase, in the one shape both Simple and Atomic sites serve.
 *
 * The two platforms answer from different sources — a cached store query on Simple, a payload
 * synced from billing on Atomic — and used to hand back bare rows whose fields differed between
 * them. This declares the shape instead, so that consumers can be written once.
 *
 * This is the site-side sibling of `Billing_Upgrade`, which returns a much richer object from
 * the purchases endpoints. `Billing_Upgrade` is billing's own record of a purchase and needs
 * the billing codebase to build it; `WPCOM_Site_Purchase` is what a site can answer about itself
 * from data it already holds. It is safe on the feature-check path and can exist on Atomic,
 * where billing does not ship. Use `Billing_Upgrade` when you need the full purchase record
 * and billing is available; use `WPCOM_Site_Purchase` when you are on a site asking what it owns.
 */
class WPCOM_Site_Purchase {
	/**
	 * Object-cache group for billing-derived state. Shared with the site's purchases, which the
	 * same two hooks already invalidate, and registered as a global group in object-cache.php --
	 * the keys carry their own blog ID and are read from whichever blog is current.
	 */
	private const BILLING_STATES_CACHE_GROUP = 'site_purchases';

	/**
	 * How long billing-derived state stays cached. See billing_states_for_blog() for what the TTL
	 * is actually covering, which is less than it first appears.
	 */
	private const BILLING_STATES_CACHE_TTL = HOUR_IN_SECONDS;

	/**
	 * How long a *failed* lookup stays cached.
	 *
	 * Far shorter than a successful one. Caching the failure at all is what stops a persistently
	 * broken billing stack from being asked again on every pageview, but a blip lasting one request
	 * should not go on being answered for the rest of the hour: while it is cached, both accessors
	 * answer null and consumers fall back to the raw auto-renew flag -- the very value they exist
	 * to distrust.
	 */
	private const BILLING_STATES_FAILURE_TTL = 30;

	/**
	 * MC stat name under which billing-state lookups are counted, and the bins broken out of it.
	 *
	 * Static strings, and within the 32-character limit MC imposes on both a name and a bin.
	 * Visible at https://mc.a8c.com/s/wpcom-site-purchase/stat-total/ -- and only there until it
	 * clears 100 hits a day, which is the threshold for the searchable stat list.
	 */
	private const BILLING_STATES_STAT_NAME   = 'wpcom-site-purchase';
	private const BILLING_STATES_STAT_LOOKUP = 'billing-lookup';
	private const BILLING_STATES_STAT_HIT    = 'billing-cache-hit';
	private const BILLING_STATES_STAT_ERROR  = 'billing-error';

	/**
	 * The blog the purchase belongs to.
	 *
	 * @var int
	 */
	public int $blog_id;

	/**
	 * The product's slug.
	 *
	 * @var string
	 */
	public string $product_slug;

	/**
	 * The product's ID.
	 *
	 * @var string
	 */
	public string $product_id;

	/**
	 * The billing product's slug.
	 *
	 * @var string
	 */
	public string $billing_product_slug;

	/**
	 * The product's type.
	 *
	 * @var string
	 */
	public string $product_type;

	/**
	 * The ISO 8601 date the purchase was made, carrying an explicit offset rather than
	 * normalised to UTC.
	 *
	 * @var string
	 */
	public string $subscribed_date;

	/**
	 * The ISO 8601 date the purchase expires, on the same terms as `$subscribed_date`.
	 *
	 * @var string
	 */
	public string $expiry_date;

	/**
	 * The subscription's ID.
	 *
	 * @var string
	 */
	public string $subscription_id;

	/**
	 * Whether the owner has auto-renew switched on.
	 *
	 * Both names hold it, populated from whichever one the source provides: Simple sites call it
	 * `user_allows_auto_renew`, Atomic sites `auto_renew`.
	 *
	 * @var bool
	 */
	public bool $user_allows_auto_renew;

	/**
	 * Alias of `$user_allows_auto_renew`.
	 *
	 * @var bool
	 */
	public bool $auto_renew;

	/**
	 * Only synced payloads carry an ownership.
	 *
	 * @var string|null
	 */
	public ?string $ownership_id = null;

	/**
	 * Billing-derived state, when it arrived with the source.
	 *
	 * Private so that it cannot be read without going through the accessors, which know how to
	 * resolve it when it did not.
	 *
	 * @var bool|null
	 */
	private ?bool $might_still_auto_renew = null;

	/**
	 * Sibling of `$might_still_auto_renew`; same reason for being private.
	 *
	 * @var string|null
	 */
	private ?string $first_auto_renew_attempt_date = null;

	/**
	 * Builds from a row of the Simple site store query.
	 *
	 * Leaves the two billing-derived fields null on purpose, so the accessors resolve them live.
	 * They track the passage of time, and the rows this is built from are cached for a day, so a
	 * value stored here would go stale between refreshes. Only the synced payload carries them
	 * pre-computed, because an Atomic site has no billing code-base to ask.
	 *
	 * @param object $row     A row as returned by _wpcom_features_get_simple_site_purchases().
	 * @param int    $blog_id The blog the row belongs to.
	 */
	public static function from_store_row( object $row, int $blog_id ): self {
		$purchase = new self();

		$purchase->blog_id                = $blog_id;
		$purchase->product_slug           = (string) $row->product_slug;
		$purchase->product_id             = (string) $row->product_id;
		$purchase->billing_product_slug   = (string) $row->billing_product_slug;
		$purchase->product_type           = (string) $row->product_type;
		$purchase->subscribed_date        = (string) $row->subscribed_date;
		$purchase->expiry_date            = (string) $row->expiry_date;
		$purchase->subscription_id        = (string) $row->subscription_id;
		$purchase->user_allows_auto_renew = (bool) $row->user_allows_auto_renew;
		$purchase->auto_renew             = $purchase->user_allows_auto_renew;

		return $purchase;
	}

	/**
	 * Builds from an entry of the payload synced to an Atomic site.
	 *
	 * Every field is optional: a site holds whatever it was last synced with, which may predate
	 * any given field.
	 *
	 * @param object $entry   One decoded entry of WPCOM_PURCHASES.
	 * @param int    $blog_id The blog the entry belongs to.
	 */
	public static function from_synced_payload( object $entry, int $blog_id ): self {
		$purchase = new self();

		$purchase->blog_id                = $blog_id;
		$purchase->product_slug           = self::text( $entry->product_slug ?? null );
		$purchase->product_id             = self::text( $entry->product_id ?? null );
		$purchase->billing_product_slug   = self::text( $entry->billing_product_slug ?? null );
		$purchase->product_type           = self::text( $entry->product_type ?? null );
		$purchase->subscribed_date        = self::text( $entry->subscribed_date ?? null );
		$purchase->expiry_date            = self::text( $entry->expiry_date ?? null );
		$purchase->subscription_id        = self::text( $entry->subscription_id ?? null );
		$purchase->ownership_id           = is_scalar( $entry->ownership_id ?? null ) ? (string) $entry->ownership_id : null;
		$purchase->user_allows_auto_renew = (bool) ( $entry->auto_renew ?? false );
		$purchase->auto_renew             = $purchase->user_allows_auto_renew;

		$purchase->might_still_auto_renew        = is_bool( $entry->might_still_auto_renew ?? null ) ? $entry->might_still_auto_renew : null;
		$purchase->first_auto_renew_attempt_date = is_string( $entry->first_auto_renew_attempt_date ?? null ) ? $entry->first_auto_renew_attempt_date : null;

		return $purchase;
	}

	/**
	 * Coerces a decoded JSON value to a string, defaulting anything that is not a scalar.
	 *
	 * Guards from_synced_payload() against a field arriving with the wrong shape -- an object or
	 * array where a scalar was expected, which JSON can express trivially and an ordinary cast
	 * cannot survive.
	 *
	 * @param mixed $value Decoded JSON value.
	 */
	private static function text( $value ): string {
		return is_scalar( $value ) ? (string) $value : '';
	}

	/**
	 * Whether a renewal will really be attempted, rather than merely having been asked for.
	 *
	 * The raw auto-renew flag stays true for subscriptions that cannot renew — one with no
	 * chargeable payment method attached, for instance — so only billing can answer this.
	 * Null wherever billing cannot be reached.
	 *
	 * NOT A FREE GETTER. On a Simple site whose purchase carries no stored answer this reaches
	 * billing: a store query, and the whole billing code-base loaded into a request that may
	 * never have needed it. Cached for an hour, so the repeat cost is a memcache get, but the
	 * first one is real. Don't call it on a path that runs for every site regardless of expiry;
	 * gate it on the site actually being close enough to expiry for the answer to matter.
	 */
	public function might_still_auto_renew(): ?bool {
		return $this->might_still_auto_renew ?? $this->billing_state()?->might_still_auto_renew;
	}

	/**
	 * The UTC date of the first scheduled auto-renewal attempt, as an ISO 8601 string.
	 *
	 * The date rather than "is it behind us", because a synced copy is only refreshed on
	 * subscription events and never on the passage of time; comparing this against the reader's
	 * own clock stays correct in between. Being scheduled is not a promise that an attempt runs,
	 * nor that it runs at this time of day. Null either because nothing is scheduled -- no
	 * meaningful expiry to schedule against, e.g. a VIP domain or a one-time product -- or
	 * because billing could not be reached; a consumer cannot tell the two apart.
	 *
	 * NOT A FREE GETTER. On a Simple site whose purchase carries no stored answer this reaches
	 * billing: a store query, and the whole billing code-base loaded into a request that may
	 * never have needed it. Cached for an hour, so the repeat cost is a memcache get, but the
	 * first one is real. Don't call it on a path that runs for every site regardless of expiry;
	 * gate it on the site actually being close enough to expiry for the answer to matter.
	 */
	public function first_auto_renew_attempt_date(): ?string {
		return $this->first_auto_renew_attempt_date ?? $this->billing_state()?->first_auto_renew_attempt_date;
	}

	/**
	 * Billing does not necessarily know about every subscription, so this may be null.
	 */
	private function billing_state(): ?object {
		return self::billing_states_for_blog( $this->blog_id )[ $this->subscription_id ] ?? null;
	}

	/**
	 * Billing-derived state for a site's subscriptions, keyed by subscription ID.
	 *
	 * Only Simple sites can answer. Answering pulls the entire billing stack into a request that
	 * may never have loaded it. The billing code-base does not ship everywhere this file runs, and
	 * a single subscription whose product no longer loads throws for the whole site; both cases
	 * yield an empty map, so every value must be treated as optional.
	 *
	 * Memoized per request, so that a site with many purchases costs one lookup rather than one
	 * per purchase, and cached in the object cache for an hour on top, so that a careless caller
	 * costs a memcache get rather than the query and the load. Cleared on `subscription_changed`
	 * and `wpcom_site_purchases_cleared`, alongside the other `site_purchases` entries.
	 *
	 * `subscription_changed` is the one that carries the weight, and it is scoped to the
	 * subscription row -- which covers more of `might_still_auto_renew` than it looks, since both
	 * the subscription's status and the `auto_renew` column live there. Everything a user actively
	 * does is therefore reflected at once, including the case that would otherwise be a support
	 * ticket: "I re-enabled auto-renew, why is it still nagging me?".
	 *
	 * The TTL therefore only has to cover what no subscription event announces, which is two
	 * things. `is_past_last_auto_renew_attempt_date()` is a clock comparison, but against a
	 * timestamp pinned to the start of a UTC day, so it flips once, on a day boundary -- a shorter
	 * TTL would be measuring a day-granular signal to the minute. And the payment method reached
	 * through `will_auto_renew()` lives in Billingdaddy ownerships rather than on the subscription,
	 * so a card being replaced, removed, or reaching its own expiry never touches the row and never
	 * fires the hook. There is no Billingdaddy action to subscribe to for that today; an hour is
	 * the bound on how stale a notice can be because of it.
	 *
	 * `first_auto_renew_attempt_date` needs none of this care: it is a date, and callers compare it
	 * against their own clock.
	 *
	 * @param int $blog_id Blog ID to look up.
	 *
	 * @return array Map of subscription ID to an object of derived state. Empty where unavailable.
	 */
	private static function billing_states_for_blog( int $blog_id ): array {
		static $states = array();

		if ( isset( $states[ $blog_id ] ) ) {
			return $states[ $blog_id ];
		}

		$states[ $blog_id ] = array();

		// The whole loader rather than just the class file, as get_site_billing_upgrades() also
		// reaches for store_logger(). Unreadable wherever the billing code-base does not ship.
		// Checked before the cache is consulted, so that Atomic -- where this is never readable
		// -- pays nothing at all, not even a memcache round trip.
		$billing_loader = WP_CONTENT_DIR . '/admin-plugins/wpcom-billing.php';
		if ( ! is_readable( $billing_loader ) ) {
			return $states[ $blog_id ];
		}

		$cache_key = self::billing_states_cache_key( $blog_id );
		$cached    = wp_cache_get( $cache_key, self::BILLING_STATES_CACHE_GROUP );
		if ( is_array( $cached ) ) {
			self::bump_billing_stat( self::BILLING_STATES_STAT_HIT );
			$states[ $blog_id ] = $cached;
			return $states[ $blog_id ];
		}

		// Bumped where the work actually happens, so that a consumer which has wandered onto a
		// hot path shows up in MC as a spike rather than as a billing incident.
		self::bump_billing_stat( self::BILLING_STATES_STAT_LOOKUP );

		$failed = false;

		try {
			require_once $billing_loader;

			// Subscriptions only: skips domain-subscription combining, so every upgrade still
			// matches one store subscription.
			foreach ( WPCOM_Store_API::get_site_billing_upgrades( $blog_id, true ) as $upgrade ) {
				$states[ $blog_id ][ (string) $upgrade->ID ] = (object) array(
					'might_still_auto_renew'        => $upgrade->might_still_auto_renew,
					'first_auto_renew_attempt_date' => $upgrade->first_auto_renew_attempt_date,
				);
			}
		} catch ( \Throwable $e ) {
			$states[ $blog_id ] = array();
			$failed             = true;
			self::bump_billing_stat( self::BILLING_STATES_STAT_ERROR );
		}

		// The empty map is cached too. Reaching billing and coming back with nothing costs the
		// same as reaching it and finding something, and a site that has just thrown is exactly
		// the one that should not be asked again on the next pageview -- but only briefly, so a
		// blip does not keep answering null long after it has passed.
		wp_cache_set(
			$cache_key,
			$states[ $blog_id ],
			self::BILLING_STATES_CACHE_GROUP,
			$failed ? self::BILLING_STATES_FAILURE_TTL : self::BILLING_STATES_CACHE_TTL
		);

		return $states[ $blog_id ];
	}

	/**
	 * Object-cache key for a blog's billing-derived state.
	 *
	 * Carries the store-subscriptions table name, as the neighbouring `site_purchases` entries
	 * do, to keep the production and test stores from reading each other's answers.
	 *
	 * Public for inspection -- reading the entry by hand while debugging, or asserting on it in a
	 * test. Invalidation goes through forget_billing_states() instead, so that the group name does
	 * not have to travel with the key.
	 *
	 * WPCOM ONLY, despite living in a class that is otherwise safe on Atomic: there are no store
	 * tables there, so `$wpdb->store_subscriptions` is not a property and there is nothing to key
	 * on. Nothing calls this on Atomic today -- billing_states_for_blog() bails before reaching
	 * it, and the other caller is a wpcom-only mu-plugin -- and nothing should start.
	 *
	 * @param int $blog_id Blog ID to look up.
	 */
	public static function billing_states_cache_key( int $blog_id ): string {
		global $wpdb;

		return "billing_states_$blog_id-{$wpdb->store_subscriptions}";
	}

	/**
	 * Drop a blog's cached billing-derived state.
	 *
	 * The whole of the invalidation, so that a caller needs neither the key nor the group and
	 * cannot drift from either. `clear_wp_cache_site_purchases()` in wpcom-features.php is the
	 * one that matters; it runs on `subscription_changed` and `wpcom_site_purchases_cleared`.
	 *
	 * WPCOM ONLY, for the same reason as the key it builds.
	 *
	 * @param int $blog_id Blog whose entry should be forgotten.
	 */
	public static function forget_billing_states( int $blog_id ): void {
		wp_cache_delete( self::billing_states_cache_key( $blog_id ), self::BILLING_STATES_CACHE_GROUP );
	}

	/**
	 * Count a billing-state lookup in MC.
	 *
	 * A counter rather than a log line: this sits behind a feature-check path, where per-event
	 * logging would be a firehose, and the question worth asking is how often it runs, not which
	 * request ran it. Best-effort -- stats must never be the reason a page fails to render.
	 *
	 * @param string $bin Stat bin to bump.
	 */
	private static function bump_billing_stat( string $bin ): void {
		if ( ! function_exists( 'require_lib' ) ) {
			return;
		}

		try {
			require_lib( 'mc-stats' );

			if ( function_exists( 'bump_stats_extras' ) ) {
				bump_stats_extras( self::BILLING_STATES_STAT_NAME, $bin );
			}
		} catch ( \Throwable $e ) {
			return;
		}
	}
}
