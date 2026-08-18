<?php
/**
 * Expiry_Data Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/class-expiry-data.php';

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data
 */
#[CoversClass( Expiry_Data::class )]
class Expiry_Data_Test extends \WorDBless\BaseTestCase {

	private const FIXED_NOW = 1735689600; // 2025-01-01 00:00:00 UTC.

	/**
	 * Build a purchase fixture object.
	 *
	 * @param string $slug                  Product slug.
	 * @param int    $days_until_expiry     Negative for past expiry.
	 * @param bool   $user_allows_auto_renew Auto-renew flag.
	 */
	private function purchase( string $slug, int $days_until_expiry, bool $user_allows_auto_renew = false ): object {
		$expiry_ts = self::FIXED_NOW + ( $days_until_expiry * DAY_IN_SECONDS );
		return (object) array(
			'product_slug'           => $slug,
			'expiry_date'            => gmdate( 'c', $expiry_ts ),
			'user_allows_auto_renew' => $user_allows_auto_renew,
		);
	}

	/**
	 * Build a purchase fixture that answers like the declared purchase shape.
	 *
	 * @param int       $days_until_expiry      Negative for past expiry.
	 * @param bool      $raw_auto_renew         The customer's raw auto-renew flag.
	 * @param bool|null $might_still_auto_renew Effective answer, or null when unknown.
	 * @param int|null  $attempt_days_from_now  First renewal attempt, relative to the fixed now.
	 * @param string    $slug                   Product slug.
	 */
	private function declared_purchase( int $days_until_expiry, bool $raw_auto_renew, ?bool $might_still_auto_renew, ?int $attempt_days_from_now = null, string $slug = 'business-bundle' ): object {
		$purchase = new class() {
			public string $product_slug         = 'business-bundle';
			public string $expiry_date          = '';
			public bool $user_allows_auto_renew = false;

			/**
			 * @var bool|null
			 */
			public ?bool $might_still = null;

			/**
			 * @var string|null
			 */
			public ?string $first_attempt = null;

			/**
			 * Counts reads of each billing-backed accessor. On a Simple site
			 * these are not getters: they reach the store DB and pull in the
			 * whole billing stack.
			 *
			 * @var int
			 */
			public int $might_still_reads = 0;

			/**
			 * @var int
			 */
			public int $first_attempt_reads = 0;

			public function might_still_auto_renew(): ?bool {
				++$this->might_still_reads;
				return $this->might_still;
			}

			public function first_auto_renew_attempt_date(): ?string {
				++$this->first_attempt_reads;
				return $this->first_attempt;
			}
		};

		$purchase->product_slug           = $slug;
		$purchase->expiry_date            = gmdate( 'c', self::FIXED_NOW + ( $days_until_expiry * DAY_IN_SECONDS ) );
		$purchase->user_allows_auto_renew = $raw_auto_renew;
		$purchase->might_still            = $might_still_auto_renew;
		$purchase->first_attempt          = null === $attempt_days_from_now
			? null
			: gmdate( 'c', self::FIXED_NOW + ( $attempt_days_from_now * DAY_IN_SECONDS ) );

		return $purchase;
	}

	public function test_approaching_when_renewal_cannot_go_through_despite_the_flag(): void {
		// The flag says it will renew; billing knows it cannot.
		$state = Expiry_Data::compute_state_from_purchase(
			$this->declared_purchase( 45, true, false ),
			self::FIXED_NOW
		);
		$this->assertNotNull( $state );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $state['state'] );
		$this->assertFalse( $state['auto_renew'] );
	}

	public function test_active_while_a_renewal_attempt_is_still_ahead(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->declared_purchase( 45, true, true, 15 ),
			self::FIXED_NOW
		);
		$this->assertNotNull( $state );
		$this->assertSame( Expiry_Data::STATE_ACTIVE, $state['state'] );
		$this->assertTrue( $state['auto_renew'] );
	}

	public function test_approaching_once_the_first_renewal_attempt_has_passed(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->declared_purchase( 15, true, true, -1 ),
			self::FIXED_NOW
		);
		$this->assertNotNull( $state );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $state['state'] );
	}

	public function test_unknown_renewal_state_falls_back_to_the_raw_flag(): void {
		// Atomic sites that have not re-synced onto the declared shape answer
		// null, and must keep behaving as they did before it existed.
		$off = Expiry_Data::compute_state_from_purchase(
			$this->declared_purchase( 45, false, null ),
			self::FIXED_NOW
		);
		$this->assertNotNull( $off );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $off['state'] );

		$on = Expiry_Data::compute_state_from_purchase(
			$this->declared_purchase( 45, true, null ),
			self::FIXED_NOW
		);
		$this->assertNotNull( $on );
		$this->assertSame( Expiry_Data::STATE_ACTIVE, $on['state'] );
	}

	public function test_no_billing_is_consulted_far_from_expiry(): void {
		// Reading either accessor costs a store-DB query and loads the billing
		// stack, on every admin pageview of every Simple site. Outside the
		// widest notice window the answer cannot change the state, so it must
		// not be asked for. Both raw flags, because the flag picks the branch.
		// The attempt lands 30 days before expiry, as a real annual plan's does.
		foreach ( array( true, false ) as $raw_auto_renew ) {
			$purchase = $this->declared_purchase( 300, $raw_auto_renew, true, 270 );

			$state = Expiry_Data::compute_state_from_purchase( $purchase, self::FIXED_NOW );

			$this->assertNotNull( $state );
			$this->assertSame( Expiry_Data::STATE_ACTIVE, $state['state'] );
			$this->assertSame( 0, $purchase->might_still_reads );
			$this->assertSame( 0, $purchase->first_attempt_reads );
		}
	}

	public function test_a_renewal_attempt_beyond_the_widest_window_is_ignored(): void {
		// The gate assumes no plan schedules its first renewal attempt more
		// than ANNUAL_NOTICE_DAYS before expiry. Should one ever do so, this
		// is what changes: the warning waits for the window instead of firing
		// as soon as the attempt passes. Pinned so the trade-off is visible if
		// the assumption is ever broken.
		$purchase = $this->declared_purchase( 300, true, true, -1 );

		$state = Expiry_Data::compute_state_from_purchase( $purchase, self::FIXED_NOW );

		$this->assertNotNull( $state );
		$this->assertSame( Expiry_Data::STATE_ACTIVE, $state['state'] );
	}

	public function test_no_billing_is_consulted_for_a_monthly_plan_outside_its_own_window(): void {
		// A monthly plan's window is 7 days, not the annual 60, and gating on
		// the wider of the two would keep paying for billing through the whole
		// 8-60 day band for nothing: a monthly term is excluded from the
		// attempt-passed warning outright, and 30 days is well outside its
		// auto-renew-off window, so both branches land on STATE_ACTIVE.
		foreach ( array( true, false ) as $raw_auto_renew ) {
			$purchase = $this->declared_purchase( 30, $raw_auto_renew, true, -1, 'personal-bundle-monthly' );

			$state = Expiry_Data::compute_state_from_purchase( $purchase, self::FIXED_NOW );

			$this->assertNotNull( $state );
			$this->assertSame( Expiry_Data::STATE_ACTIVE, $state['state'] );
			$this->assertSame( 0, $purchase->might_still_reads );
			$this->assertSame( 0, $purchase->first_attempt_reads );
		}
	}

	public function test_billing_is_consulted_for_a_monthly_plan_inside_its_window(): void {
		$purchase = $this->declared_purchase( 3, false, false, null, 'personal-bundle-monthly' );

		$state = Expiry_Data::compute_state_from_purchase( $purchase, self::FIXED_NOW );

		$this->assertNotNull( $state );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $state['state'] );
		$this->assertGreaterThan( 0, $purchase->might_still_reads );
	}

	public function test_billing_is_consulted_inside_the_notice_window(): void {
		// The other half of the gate: it must not be so wide that a site which
		// does need a notice stops asking the question.
		$purchase = $this->declared_purchase( 45, true, true, -1 );

		$state = Expiry_Data::compute_state_from_purchase( $purchase, self::FIXED_NOW );

		$this->assertNotNull( $state );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $state['state'] );
		$this->assertGreaterThan( 0, $purchase->might_still_reads );
	}

	public function test_billing_is_consulted_after_expiry(): void {
		// Past expiry the copy distinguishes "still trying to renew" from
		// "gone", so the effective answer is still needed.
		$purchase = $this->declared_purchase( -5, true, false );

		$state = Expiry_Data::compute_state_from_purchase( $purchase, self::FIXED_NOW );

		$this->assertNotNull( $state );
		$this->assertSame( Expiry_Data::STATE_EXPIRED_GRACE, $state['state'] );
		$this->assertFalse( $state['auto_renew'] );
		$this->assertGreaterThan( 0, $purchase->might_still_reads );
	}

	public function test_is_monthly_plan(): void {
		$this->assertTrue( Expiry_Data::is_monthly_plan( 'personal-bundle-monthly' ) );
		$this->assertTrue( Expiry_Data::is_monthly_plan( 'BUSINESS_MONTHLY' ) );
		$this->assertFalse( Expiry_Data::is_monthly_plan( 'business-bundle' ) );
	}

	public function test_active_annual_far_from_expiry(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->purchase( 'business-bundle', 200 ),
			self::FIXED_NOW
		);
		$this->assertNotNull( $state );
		$this->assertSame( Expiry_Data::STATE_ACTIVE, $state['state'] );
		$this->assertSame( 200, $state['days_remaining'] );
		$this->assertNull( $state['grace_days_left'] );
		$this->assertFalse( $state['auto_renew'] );
		$this->assertFalse( $state['is_monthly'] );
	}

	public function test_approaching_annual_within_60_days_renew_off(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->purchase( 'business-bundle', 45 ),
			self::FIXED_NOW
		);
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $state['state'] );
		$this->assertSame( 45, $state['days_remaining'] );
	}

	public function test_active_annual_within_60_days_when_renew_on(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->purchase( 'business-bundle', 45, true ),
			self::FIXED_NOW
		);
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_ACTIVE, $state['state'] );
		$this->assertTrue( $state['auto_renew'] );
	}

	public function test_annual_still_renewing_warns_once_an_attempt_has_passed(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->declared_purchase( 20, true, true, -1 ),
			self::FIXED_NOW
		);
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $state['state'] );
		$this->assertTrue( $state['auto_renew'] );
	}

	public function test_monthly_still_renewing_never_warns_before_expiry(): void {
		// Same passed-attempt shape as above, but a monthly term. The spec keeps
		// the still-renewing warning to annual and longer terms.
		$state = Expiry_Data::compute_state_from_purchase(
			$this->declared_purchase( 3, true, true, -1, 'business-bundle-monthly' ),
			self::FIXED_NOW
		);
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_ACTIVE, $state['state'] );
	}

	public function test_monthly_still_renewing_warns_once_in_grace(): void {
		// After expiry both terms get the notice, so the exclusion above must not
		// leak past the expiry date.
		$state = Expiry_Data::compute_state_from_purchase(
			$this->declared_purchase( -3, true, true, -5, 'business-bundle-monthly' ),
			self::FIXED_NOW
		);
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_EXPIRED_GRACE, $state['state'] );
		$this->assertTrue( $state['auto_renew'] );
	}

	public function test_approaching_monthly_within_7_days(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->purchase( 'business-bundle-monthly', 5 ),
			self::FIXED_NOW
		);
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $state['state'] );
	}

	public function test_active_monthly_between_7_and_60_days(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->purchase( 'business-bundle-monthly', 30 ),
			self::FIXED_NOW
		);
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_ACTIVE, $state['state'] );
	}

	public function test_approaching_at_window_boundary(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->purchase( 'business-bundle', 60 ),
			self::FIXED_NOW
		);
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $state['state'] );
	}

	/**
	 * The three post-expiry windows, pinned to the day. The spec names them
	 * "grace 0-29 days past expiry", "self-serve restore 30-59", and "restore by
	 * support only, 60+" — the last of which no surface renders yet, so it must
	 * stay absent rather than fall through to the reverted notice.
	 */
	public function test_post_expiry_window_boundaries(): void {
		$windows = array(
			-1  => Expiry_Data::STATE_EXPIRED_GRACE,
			-29 => Expiry_Data::STATE_EXPIRED_GRACE,
			-30 => Expiry_Data::STATE_EXPIRED,
			-59 => Expiry_Data::STATE_EXPIRED,
			-60 => null,
			-90 => null,
		);
		foreach ( $windows as $days => $expected ) {
			$state = Expiry_Data::compute_state_from_purchase(
				$this->purchase( 'business-bundle', $days ),
				self::FIXED_NOW
			);
			if ( null === $expected ) {
				$this->assertNull( $state, "{$days} days past expiry should produce no state" );
				continue;
			}
			$this->assertIsArray( $state );
			$this->assertSame( $expected, $state['state'], "wrong state {$days} days past expiry" );
		}
	}

	public function test_expired_grace_just_after_expiry(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->purchase( 'business-bundle', -1 ),
			self::FIXED_NOW
		);
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_EXPIRED_GRACE, $state['state'] );
		$this->assertSame( -1, $state['days_remaining'] );
		$this->assertSame( 29, $state['grace_days_left'] );
	}

	public function test_expired_grace_last_day(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->purchase( 'business-bundle', -29 ),
			self::FIXED_NOW
		);
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_EXPIRED_GRACE, $state['state'] );
		$this->assertSame( 1, $state['grace_days_left'] );
	}

	public function test_expired_post_grace_first_day(): void {
		$state = Expiry_Data::compute_state_from_purchase(
			$this->purchase( 'business-bundle', -30 ),
			self::FIXED_NOW
		);
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_EXPIRED, $state['state'] );
		$this->assertSame( 0, $state['grace_days_left'] );
	}

	public function test_far_post_grace_returns_null(): void {
		$this->assertNull(
			Expiry_Data::compute_state_from_purchase(
				$this->purchase( 'business-bundle', -60 ),
				self::FIXED_NOW
			)
		);
		$this->assertNull(
			Expiry_Data::compute_state_from_purchase(
				$this->purchase( 'business-bundle', -90 ),
				self::FIXED_NOW
			)
		);
	}

	public function test_returns_null_for_missing_fields(): void {
		$this->assertNull( Expiry_Data::compute_state_from_purchase( (object) array(), self::FIXED_NOW ) );
		$this->assertNull(
			Expiry_Data::compute_state_from_purchase(
				(object) array( 'product_slug' => 'business-bundle' ),
				self::FIXED_NOW
			)
		);
	}

	public function test_returns_null_for_unparseable_date(): void {
		$purchase = (object) array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => 'not-a-date',
		);
		$this->assertNull( Expiry_Data::compute_state_from_purchase( $purchase, self::FIXED_NOW ) );
	}

	public function test_pick_primary_plan_purchase_picks_latest_expiry(): void {
		$earlier = $this->purchase( 'business-bundle', 30 );
		$later   = $this->purchase( 'business-bundle', 180 );
		$result  = Expiry_Data::pick_primary_plan_purchase( array( $earlier, $later ) );
		$this->assertSame( $later->expiry_date, $result->expiry_date );
	}

	public function test_pick_primary_plan_purchase_ignores_non_plans(): void {
		$plan       = $this->purchase( 'business-bundle', 30 );
		$non_plan_a = (object) array(
			'product_slug' => 'jetpack-backup-yearly',
			'expiry_date'  => gmdate( 'c', self::FIXED_NOW + 365 * DAY_IN_SECONDS ),
		);
		$non_plan_b = (object) array(
			'product_slug' => 'wordpress-com-domain',
			'expiry_date'  => gmdate( 'c', self::FIXED_NOW + 700 * DAY_IN_SECONDS ),
		);
		$result     = Expiry_Data::pick_primary_plan_purchase( array( $non_plan_a, $plan, $non_plan_b ) );
		$this->assertSame( $plan->expiry_date, $result->expiry_date );
	}

	public function test_simple_site_purchase_list_shape(): void {
		// Verbatim wpcom_get_site_purchases() shape from a Simple site: Business
		// plan + addons. Exercises plan filtering and `user_allows_auto_renew` mapping.
		$now       = strtotime( '2026-05-29T00:00:00+00:00' );
		$purchases = array(
			(object) array(
				'product_slug'           => 'business-bundle',
				'product_id'             => 1008,
				'product_type'           => 'bundle',
				'subscribed_date'        => '2025-01-10T08:08:28+00:00',
				'expiry_date'            => '2027-01-10T00:00:00+00:00',
				'subscription_id'        => 25341398,
				'user_allows_auto_renew' => true,
				'billing_product_slug'   => 'wp-bundle-business',
			),
			(object) array(
				'product_slug'           => 'dotorg_domain',
				'product_id'             => 5126,
				'product_type'           => 'domain_reg',
				'subscribed_date'        => '2022-02-03T23:38:09+00:00',
				'expiry_date'            => '2027-03-16T00:00:00+00:00',
				'subscription_id'        => 24516717,
				'user_allows_auto_renew' => true,
				'billing_product_slug'   => 'wp-dot-org-registration',
			),
			(object) array(
				'product_slug'           => 'wpcom_search',
				'product_id'             => 800,
				'product_type'           => 'search',
				'subscribed_date'        => '2022-08-22T16:47:38+00:00',
				'expiry_date'            => '2026-08-22T00:00:00+00:00',
				'subscription_id'        => 19354100,
				'user_allows_auto_renew' => true,
				'billing_product_slug'   => 'wp-search',
			),
		);

		$primary = Expiry_Data::pick_primary_plan_purchase( $purchases );
		$this->assertNotNull( $primary );
		$this->assertSame( 'business-bundle', $primary->product_slug );

		$state = Expiry_Data::compute_state_from_purchase( $primary, $now );
		$this->assertIsArray( $state );
		$this->assertSame( Expiry_Data::STATE_ACTIVE, $state['state'] );
		$this->assertTrue( $state['auto_renew'] );
	}

	public function test_atomic_site_purchase_shape_uses_auto_renew_field(): void {
		// Verbatim Atomic-site purchase shape — auto-renew is on `auto_renew`,
		// not `user_allows_auto_renew`.
		$purchase = (object) array(
			'product_slug'         => 'business-bundle',
			'billing_product_slug' => 'wp-bundle-business',
			'product_id'           => 1008,
			'product_type'         => 'bundle',
			'subscribed_date'      => '2025-06-03T09:03:31+00:00',
			'expiry_date'          => '2026-06-03T00:00:00+00:00',
			'ownership_id'         => 62857966,
			'auto_renew'           => false,
			'subscription_id'      => 26532009,
		);

		$state = Expiry_Data::compute_state_from_purchase( $purchase, strtotime( '2026-05-29T00:00:00+00:00' ) );
		$this->assertNotNull( $state );
		$this->assertFalse( $state['auto_renew'] );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $state['state'] );
		$this->assertSame( 5, $state['days_remaining'] );
	}

	public function test_pick_primary_plan_purchase_returns_null_when_no_plans(): void {
		$this->assertNull( Expiry_Data::pick_primary_plan_purchase( array() ) );
		$this->assertNull( Expiry_Data::pick_primary_plan_purchase( null ) );
		$this->assertNull(
			Expiry_Data::pick_primary_plan_purchase(
				array(
					(object) array(
						'product_slug' => 'jetpack-backup-yearly',
						'expiry_date'  => gmdate( 'c' ),
					),
				)
			)
		);
	}

	public function test_get_cta_urls_appends_redirect_to(): void {
		$state    = array(
			'state'        => Expiry_Data::STATE_EXPIRED_GRACE,
			'product_slug' => 'business-bundle',
			'auto_renew'   => false,
		);
		$redirect = 'https://example.com/wp-admin/edit.php';
		$urls     = Expiry_Data::get_cta_urls( $state, $redirect );

		$parsed = wp_parse_url( $urls['primary']['url'] );
		parse_str( $parsed['query'] ?? '', $query_args );
		$this->assertArrayHasKey( 'redirect_to', $query_args );
		$this->assertSame( $redirect, $query_args['redirect_to'] );
	}
}
