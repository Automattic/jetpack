<?php
/**
 * Tests for the My Jetpack local data filters on Simple sites.
 *
 * These lock the SHAPE of what we hand back to My Jetpack. The wpcom store and the package disagree
 * in several places - 'available' is an array locally but read as an object property, purchases have
 * no ->ID locally - and a mismatch is invisible at the PHP level while showing an owned product as
 * unowned in the UI. That is the bug this code exists to prevent, so it is what we assert.
 *
 * The wpcom platform is not loaded in the package test suite, so the tests exercise the pure
 * normalizers (the reshaping is where the bugs live) plus the off-Simple pass-through guarantee.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/my-jetpack/my-jetpack.php';

/**
 * Class My_Jetpack_Data_Filters_Test
 */
class My_Jetpack_Data_Filters_Test extends \WorDBless\BaseTestCase {

	/**
	 * The 'available' map must come back as an object.
	 *
	 * My Jetpack reads $features['available']->$feature (Product::get_paid_bundles_that_include_product).
	 * Locally it is an associative array; passed through untouched, every paid-bundle lookup returns
	 * nothing and paid products render as unowned.
	 */
	public function test_normalize_features_casts_available_to_an_object() {
		$features = wpcom_my_jetpack_normalize_features(
			array(
				'active'    => array( 'search', 'premium-themes' ),
				'available' => array( 'search' => array( 'value_bundle', 'business-bundle' ) ),
			)
		);

		$this->assertIsArray( $features['active'], "'active' must stay a flat list for in_array()." );
		$this->assertSame( array( 'search', 'premium-themes' ), $features['active'] );

		$this->assertIsObject( $features['available'], "'available' must be an object for ->\$feature access." );
		$this->assertSame( array( 'value_bundle', 'business-bundle' ), $features['available']->search );
	}

	/**
	 * Missing keys must not fatal - an empty site is a normal case.
	 */
	public function test_normalize_features_tolerates_missing_keys() {
		$features = wpcom_my_jetpack_normalize_features( array() );

		$this->assertSame( array(), $features['active'] );
		$this->assertIsObject( $features['available'] );
	}

	/**
	 * Purchases must carry the properties My Jetpack reads.
	 *
	 * The store returns subscription_id, not ID, and no product_name/expiry_message.
	 */
	public function test_normalize_purchases_fills_in_the_expected_properties() {
		$purchases = wpcom_my_jetpack_normalize_purchases(
			array(
				(object) array(
					'product_slug'    => 'jetpack_search',
					'subscription_id' => '4242',
					'expiry_date'     => '2027-01-01T00:00:00+00:00',
				),
			)
		);

		$purchase = $purchases[0];

		$this->assertSame( '4242', $purchase->ID, 'ID must be filled in from subscription_id.' );
		$this->assertSame( 'jetpack_search', $purchase->product_name, 'product_name falls back to the slug.' );
		$this->assertSame( '', $purchase->expiry_message );

		// Passed straight through from the store.
		$this->assertSame( 'jetpack_search', $purchase->product_slug );
		$this->assertSame( '2027-01-01T00:00:00+00:00', $purchase->expiry_date );
	}

	/**
	 * Normalization must not clobber properties the store already supplied.
	 */
	public function test_normalize_purchases_does_not_overwrite_existing_properties() {
		$purchases = wpcom_my_jetpack_normalize_purchases(
			array(
				(object) array(
					'ID'             => '1',
					'product_slug'   => 'jetpack_search',
					'product_name'   => 'Jetpack Search',
					'expiry_message' => 'Expires soon',
				),
			)
		);

		$this->assertSame( '1', $purchases[0]->ID );
		$this->assertSame( 'Jetpack Search', $purchases[0]->product_name );
		$this->assertSame( 'Expires soon', $purchases[0]->expiry_message );
	}

	/**
	 * The catalog must be an object of objects: My Jetpack reads $products->$slug->cost.
	 */
	public function test_normalize_catalog_casts_both_levels_to_objects() {
		$catalog = wpcom_my_jetpack_normalize_catalog(
			array(
				'jetpack_search' => array(
					'product_slug' => 'jetpack_search',
					'cost'         => 10,
				),
			)
		);

		$this->assertIsObject( $catalog );
		$this->assertIsObject( $catalog->jetpack_search, 'Each product must be an object.' );
		$this->assertSame( 10, $catalog->jetpack_search->cost );
	}

	/**
	 * Off Simple, every filter must be an inert pass-through.
	 *
	 * This is what keeps self-hosted and Atomic on their existing HTTP path: returning the incoming
	 * null leaves My Jetpack's own lookup untouched. IS_WPCOM is not defined in this suite, so this
	 * asserts the real non-Simple behavior.
	 */
	public function test_filters_pass_through_when_not_simple() {
		$this->assertFalse( wpcom_my_jetpack_can_serve_data_locally() );

		$this->assertNull( wpcom_my_jetpack_site_features( null ) );
		$this->assertNull( wpcom_my_jetpack_site_purchases( null ) );
		$this->assertNull( wpcom_my_jetpack_site_current_plan( null ) );
		$this->assertNull( wpcom_my_jetpack_products_catalog( null ) );
		$this->assertNull( wpcom_my_jetpack_site_info( null ) );
	}
}
