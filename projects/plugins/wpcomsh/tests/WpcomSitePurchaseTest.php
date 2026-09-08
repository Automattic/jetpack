<?php
/**
 * WPCOM Site Purchase Test file.
 *
 * Covers the half of WPCOM_Site_Purchase that actually executes on an Atomic site: the purchases
 * synced into Atomic Persistent Data, read back through wpcom_get_site_purchases(). The Simple-site
 * half, and the billing lookup behind the accessors, are covered on the WordPress.com side, where
 * the billing code-base exists to be asked -- except for how a store row is read, which is the
 * same code wherever it runs and is exercised directly here.
 *
 * @package wpcomsh
 */

/**
 * Class WpcomSitePurchaseTest.
 */
class WpcomSitePurchaseTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Remove the synced payload after each test, so one test's purchases cannot leak into another.
	 */
	public function tear_down() {
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );
		parent::tear_down();
	}

	/**
	 * The synced payload is served as WPCOM_Site_Purchase, with the billing-derived state it was
	 * synced with. Billing is never consulted here -- its code-base does not ship to Atomic sites.
	 */
	public function test_synced_purchases_are_served_in_the_declared_shape() {
		$purchase = array(
			'product_slug'                  => 'business-bundle',
			'product_id'                    => '1008',
			'billing_product_slug'          => 'wp-bundle-business',
			'product_type'                  => 'bundle',
			'subscribed_date'               => '2026-04-12T18:55:02+00:00',
			'expiry_date'                   => '2027-04-12T00:00:00+00:00',
			'subscription_id'               => '42',
			'ownership_id'                  => '99',
			'auto_renew'                    => true,
			'might_still_auto_renew'        => false,
			'first_auto_renew_attempt_date' => '2027-03-13T00:00:00+00:00',
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $purchase ), JSON_UNESCAPED_SLASHES ) );

		$purchases = wpcom_get_site_purchases();
		$this->assertCount( 1, $purchases );
		$this->assertInstanceOf( WPCOM_Site_Purchase::class, $purchases[0] );

		// The payload names the flag `auto_renew`; both names carry it.
		$this->assertTrue( $purchases[0]->auto_renew );
		$this->assertTrue( $purchases[0]->user_allows_auto_renew );

		// The flag is set, yet billing had already decided the renewal cannot be attempted.
		$this->assertFalse( $purchases[0]->might_still_auto_renew() );
		$this->assertSame( '2027-03-13T00:00:00+00:00', $purchases[0]->first_auto_renew_attempt_date() );
	}

	/**
	 * A payload synced before these fields existed cannot be answered here, and says so rather
	 * than guessing.
	 */
	public function test_a_synced_purchase_without_billing_state_reports_unknown() {
		$purchase = array(
			'product_slug'    => 'business-bundle',
			'product_id'      => '1008',
			'subscription_id' => '42',
			'auto_renew'      => true,
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $purchase ), JSON_UNESCAPED_SLASHES ) );

		$purchases = wpcom_get_site_purchases();
		$this->assertNull( $purchases[0]->might_still_auto_renew() );
		$this->assertNull( $purchases[0]->first_auto_renew_attempt_date() );
	}

	/**
	 * Feature checks read this on nearly every request, so a malformed payload must degrade rather
	 * than take the site down: entries that are not objects are skipped, and fields of the wrong
	 * shape fall back to their defaults.
	 */
	public function test_a_malformed_synced_payload_does_not_fatal() {
		Atomic_Persistent_Data::set(
			'WPCOM_PURCHASES',
			wp_json_encode(
				array(
					'not-an-entry',
					array( 'product_slug' => array( 'not-a-string' ) ),
					array( 'product_slug' => 'business-bundle' ),
				),
				JSON_UNESCAPED_SLASHES
			)
		);

		$purchases = wpcom_get_site_purchases();

		// The scalar entry is dropped; the two objects survive, the malformed field defaulting.
		$this->assertCount( 2, $purchases );
		$this->assertSame( '', $purchases[0]->product_slug );
		$this->assertSame( 'business-bundle', $purchases[1]->product_slug );
	}

	/**
	 * The Simple-site rows are served from an object cache shared across requests, which has been
	 * seen to hand back arrays rather than the rows the store query returned. An array still
	 * carries the whole row, so it must produce the same purchase.
	 */
	public function test_a_store_row_is_read_in_either_shape() {
		$row = array(
			'product_slug'           => 'business-bundle',
			'product_id'             => '1008',
			'billing_product_slug'   => 'wp-bundle-business',
			'product_type'           => 'bundle',
			'subscribed_date'        => '2026-04-12T18:55:02+00:00',
			'expiry_date'            => '2027-04-12T00:00:00+00:00',
			'subscription_id'        => '42',
			'user_allows_auto_renew' => true,
		);

		$from_array = WPCOM_Site_Purchase::from_store_row( $row, 1 );

		$this->assertEquals( WPCOM_Site_Purchase::from_store_row( (object) $row, 1 ), $from_array );
		$this->assertSame( 'business-bundle', $from_array->product_slug );
		$this->assertSame( '42', $from_array->subscription_id );
		$this->assertTrue( $from_array->auto_renew );
	}

	/**
	 * Feature checks read the rows on nearly every request, so a row of the wrong shape must
	 * degrade rather than take the site down: missing and malformed fields fall back to their
	 * defaults.
	 */
	public function test_a_malformed_store_row_does_not_fatal() {
		$purchase = WPCOM_Site_Purchase::from_store_row(
			array(
				'product_slug'           => array( 'not-a-string' ),
				// An ordinary cast reads this as `true`, which would have the purchase claim
				// auto-renew is on off the back of unreadable data.
				'user_allows_auto_renew' => array( 'not-a-bool' ),
			),
			1
		);

		$this->assertSame( '', $purchase->product_slug );
		$this->assertSame( '', $purchase->expiry_date );
		$this->assertFalse( $purchase->auto_renew );
		$this->assertFalse( $purchase->user_allows_auto_renew );
	}

	/**
	 * A cached entry that is not a row at all cannot be a purchase, but must not be a fatal
	 * either: it builds an empty one, which matches no feature.
	 */
	public function test_a_store_row_that_is_not_a_row_builds_an_empty_purchase() {
		foreach ( array( 'not-a-row', null, 42 ) as $not_a_row ) {
			$purchase = WPCOM_Site_Purchase::from_store_row( $not_a_row, 1 );

			$this->assertSame( '', $purchase->product_slug );
			$this->assertSame( '', $purchase->subscription_id );
			$this->assertFalse( $purchase->auto_renew );
		}
	}
}
