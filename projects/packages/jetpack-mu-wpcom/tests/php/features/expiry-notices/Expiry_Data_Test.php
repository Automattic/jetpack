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
