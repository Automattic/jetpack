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
	 * A plain purchase row, as an Atomic site synced before the declared shape holds it.
	 *
	 * @param string $slug                   Product slug.
	 * @param int    $days_until_expiry      Negative for past expiry.
	 * @param bool   $user_allows_auto_renew Auto-renew flag.
	 */
	private function purchase( string $slug, int $days_until_expiry, bool $user_allows_auto_renew = false ): object {
		return (object) array(
			'product_slug'           => $slug,
			'product_type'           => 'bundle',
			'expiry_date'            => gmdate( 'c', self::FIXED_NOW + ( $days_until_expiry * DAY_IN_SECONDS ) ),
			'user_allows_auto_renew' => $user_allows_auto_renew,
		);
	}

	/**
	 * A purchase in the declared shape, counting how often billing is asked.
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
			public string $product_type         = 'bundle';
			public string $expiry_date          = '';
			public bool $user_allows_auto_renew = false;
			public ?bool $might_still           = null;
			public ?string $first_attempt       = null;
			public int $billing_reads           = 0;

			public function might_still_auto_renew(): ?bool {
				++$this->billing_reads;
				return $this->might_still;
			}

			public function first_auto_renew_attempt_date(): ?string {
				++$this->billing_reads;
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

	private function state( object $purchase ): array {
		$state = Expiry_Data::compute_state_from_purchase( $purchase, self::FIXED_NOW );
		$this->assertIsArray( $state );
		return $state;
	}

	public function test_pre_expiry_stage_depends_on_the_term_and_the_flag(): void {
		$cases = array(
			// [ slug, days, auto-renew flag, expected state ].
			array( 'business-bundle', 200, false, Expiry_Data::STATE_ACTIVE ),
			array( 'business-bundle', 61, false, Expiry_Data::STATE_ACTIVE ),
			array( 'business-bundle', 60, false, Expiry_Data::STATE_APPROACHING ),
			array( 'business-bundle', 0, false, Expiry_Data::STATE_APPROACHING ),
			array( 'business-bundle', 45, true, Expiry_Data::STATE_ACTIVE ),
			array( 'business-bundle-monthly', 30, false, Expiry_Data::STATE_ACTIVE ),
			array( 'business-bundle-monthly', 8, false, Expiry_Data::STATE_ACTIVE ),
			array( 'business-bundle-monthly', 7, false, Expiry_Data::STATE_APPROACHING ),
		);
		foreach ( $cases as list( $slug, $days, $auto_renew, $expected ) ) {
			$state = $this->state( $this->purchase( $slug, $days, $auto_renew ) );
			$this->assertSame( $expected, $state['state'], "wrong state for {$slug} at {$days} days" );
			$this->assertSame( $days, $state['days_remaining'] );
			$this->assertSame( $auto_renew, $state['auto_renew'] );
		}
	}

	/**
	 * Grace is 0-29 days past expiry, self-serve restore 30-59, and past that no
	 * surface renders yet, so the state must stay absent rather than fall through.
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
			$state = Expiry_Data::compute_state_from_purchase( $this->purchase( 'business-bundle', $days ), self::FIXED_NOW );
			if ( null === $expected ) {
				$this->assertNull( $state, "{$days} days past expiry should produce no state" );
				continue;
			}
			$this->assertNotNull( $state );
			$this->assertSame( $expected, $state['state'], "wrong state {$days} days past expiry" );
			$this->assertSame( $days, $state['days_remaining'] );
		}
	}

	public function test_billing_overrides_the_raw_flag_when_it_answers(): void {
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $this->state( $this->declared_purchase( 45, true, false ) )['state'] );

		$this->assertSame( Expiry_Data::STATE_APPROACHING, $this->state( $this->declared_purchase( 45, false, null ) )['state'] );
		$this->assertSame( Expiry_Data::STATE_ACTIVE, $this->state( $this->declared_purchase( 45, true, null ) )['state'] );
	}

	public function test_a_renewing_plan_warns_once_a_scheduled_attempt_has_passed(): void {
		$this->assertSame( Expiry_Data::STATE_ACTIVE, $this->state( $this->declared_purchase( 45, true, true, 15 ) )['state'] );

		$state = $this->state( $this->declared_purchase( 20, true, true, -1 ) );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $state['state'] );
		$this->assertTrue( $state['auto_renew'] );
	}

	public function test_a_renewing_monthly_plan_never_warns_before_expiry(): void {
		$this->assertSame( Expiry_Data::STATE_ACTIVE, $this->state( $this->declared_purchase( 3, true, true, -1, 'business-bundle-monthly' ) )['state'] );

		// The exclusion must not leak past the expiry date.
		$state = $this->state( $this->declared_purchase( -3, true, true, -5, 'business-bundle-monthly' ) );
		$this->assertSame( Expiry_Data::STATE_EXPIRED_GRACE, $state['state'] );
		$this->assertTrue( $state['auto_renew'] );
	}

	/**
	 * Each billing accessor is a store query that loads the billing stack on
	 * Simple, on every admin pageview, so outside a plan's own notice window
	 * neither may be read: the answer could not change the state.
	 */
	public function test_no_billing_is_consulted_outside_the_notice_window(): void {
		$cases = array(
			array( 300, 'business-bundle' ),
			array( 30, 'personal-bundle-monthly' ),
		);
		foreach ( $cases as list( $days, $slug ) ) {
			foreach ( array( true, false ) as $raw_auto_renew ) {
				$purchase = $this->declared_purchase( $days, $raw_auto_renew, true, -1, $slug );
				$this->assertSame( Expiry_Data::STATE_ACTIVE, $this->state( $purchase )['state'] );
				$this->assertSame( 0, $purchase->billing_reads, "billing was read for {$slug} at {$days} days" );
			}
		}
	}

	public function test_billing_is_consulted_inside_the_notice_window(): void {
		$cases = array(
			array( $this->declared_purchase( 45, true, true, -1 ), Expiry_Data::STATE_APPROACHING ),
			array( $this->declared_purchase( 3, false, false, null, 'personal-bundle-monthly' ), Expiry_Data::STATE_APPROACHING ),
			array( $this->declared_purchase( -5, true, false ), Expiry_Data::STATE_EXPIRED_GRACE ),
		);
		foreach ( $cases as list( $purchase, $expected ) ) {
			$this->assertSame( $expected, $this->state( $purchase )['state'] );
			$this->assertGreaterThan( 0, $purchase->billing_reads );
		}
	}

	public function test_an_unusable_purchase_has_no_state(): void {
		$this->assertNull( Expiry_Data::compute_state_from_purchase( (object) array(), self::FIXED_NOW ) );
		$this->assertNull( Expiry_Data::compute_state_from_purchase( (object) array( 'product_slug' => 'business-bundle' ), self::FIXED_NOW ) );
		$this->assertNull(
			Expiry_Data::compute_state_from_purchase(
				(object) array(
					'product_slug' => 'business-bundle',
					'expiry_date'  => 'not-a-date',
				),
				self::FIXED_NOW
			)
		);
	}

	public function test_the_plan_name_is_only_resolved_once_there_is_something_to_say(): void {
		$cache_key = 'wpcom_expiry_notices_plan_name_business-bundle_' . get_user_locale();
		set_transient( $cache_key, 'Business', HOUR_IN_SECONDS );

		try {
			$this->assertNull( $this->state( $this->purchase( 'business-bundle', 200 ) )['plan_name'] );
			$this->assertSame( 'Business', $this->state( $this->purchase( 'business-bundle', 45 ) )['plan_name'] );
		} finally {
			delete_transient( $cache_key );
		}
	}

	public function test_picks_the_plan_with_the_latest_expiry_and_skips_everything_else(): void {
		$earlier = $this->purchase( 'business-bundle', 30 );
		$later   = $this->purchase( 'business-bundle', 180 );
		$this->assertSame( $later->expiry_date, Expiry_Data::pick_primary_plan_purchase( array( $earlier, $later ) )->expiry_date );

		// Verbatim wpcom_get_site_purchases() shape from a Simple site, plus a
		// marketplace product whose slug reads like a plan.
		$purchases = array(
			(object) array(
				'product_slug'           => 'dotorg_domain',
				'product_type'           => 'domain_reg',
				'expiry_date'            => '2027-03-16T00:00:00+00:00',
				'subscription_id'        => 24516717,
				'user_allows_auto_renew' => true,
			),
			(object) array(
				'product_slug'           => 'business-bundle',
				'product_type'           => 'bundle',
				'expiry_date'            => '2027-01-10T00:00:00+00:00',
				'subscription_id'        => 25341398,
				'user_allows_auto_renew' => true,
			),
			(object) array(
				'product_slug'           => 'wpcom_search',
				'product_type'           => 'search',
				'expiry_date'            => '2026-08-22T00:00:00+00:00',
				'subscription_id'        => 19354100,
				'user_allows_auto_renew' => true,
			),
			(object) array(
				'product_slug' => 'sensei_pro_yearly',
				'product_type' => 'marketplace_plugin',
				'expiry_date'  => '2028-01-01T00:00:00+00:00',
			),
			// Synced without a product type: the slug decides.
			(object) array(
				'product_slug' => 'jetpack-backup-yearly',
				'expiry_date'  => '2028-01-01T00:00:00+00:00',
			),
		);
		$this->assertSame( 'business-bundle', Expiry_Data::pick_primary_plan_purchase( $purchases )->product_slug );

		$this->assertNull( Expiry_Data::pick_primary_plan_purchase( array() ) );
		$this->assertNull( Expiry_Data::pick_primary_plan_purchase( null ) );
		$this->assertNull( Expiry_Data::pick_primary_plan_purchase( array( $purchases[0] ) ) );
	}

	public function test_atomic_site_purchase_shape_uses_auto_renew_field(): void {
		$purchase = (object) array(
			'product_slug'    => 'business-bundle',
			'product_type'    => 'bundle',
			'expiry_date'     => '2026-06-03T00:00:00+00:00',
			'ownership_id'    => 62857966,
			'auto_renew'      => false,
			'subscription_id' => 26532009,
		);

		$state = Expiry_Data::compute_state_from_purchase( $purchase, strtotime( '2026-05-29T00:00:00+00:00' ) );
		$this->assertNotNull( $state );
		$this->assertSame( Expiry_Data::STATE_APPROACHING, $state['state'] );
		$this->assertFalse( $state['auto_renew'] );
		$this->assertSame( 5, $state['days_remaining'] );
		$this->assertSame( '26532009', $state['subscription_id'] );
	}

	public function test_the_renewal_names_the_subscription_when_the_site_knows_it(): void {
		$state = array(
			'product_slug'    => 'business-bundle',
			'subscription_id' => '26532009',
		);
		$urls  = Expiry_Data::get_cta_urls( $state );
		$this->assertStringStartsWith( 'https://wordpress.com/checkout/business-bundle/renew/26532009/', $urls['primary']['url'] );
		$this->assertStringStartsWith( 'https://wordpress.com/plans/', $urls['secondary']['url'] );

		// A purchase synced before subscription IDs carries an empty one.
		$synced_early = (object) array(
			'product_slug' => 'business-bundle',
			'product_type' => 'bundle',
			'expiry_date'  => '2026-06-03T00:00:00+00:00',
		);
		$state        = Expiry_Data::compute_state_from_purchase( $synced_early, strtotime( '2026-05-29T00:00:00+00:00' ) );
		$this->assertNotNull( $state );
		$this->assertSame( '', $state['subscription_id'] );
		$this->assertStringNotContainsString( '/renew/', Expiry_Data::get_cta_urls( $state )['primary']['url'] );
	}

	public function test_get_cta_urls_keeps_a_redirect_with_its_own_query_intact(): void {
		$redirect = 'https://example.com/wp-admin/site-editor.php?p=%2Fpage&canvas=edit';
		$urls     = Expiry_Data::get_cta_urls( array( 'product_slug' => 'business-bundle' ), $redirect );

		parse_str( (string) wp_parse_url( $urls['primary']['url'], PHP_URL_QUERY ), $query_args );
		$this->assertSame( $redirect, $query_args['redirect_to'] );
		$this->assertArrayNotHasKey( 'canvas', $query_args );
	}
}
