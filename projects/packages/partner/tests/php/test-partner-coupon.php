<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Tests the partner-coupon package.
 *
 * @package automattic/jetpack-partner
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

namespace Automattic\Jetpack;

use Jetpack_Options;
use WorDBless\BaseTestCase;

/**
 * Class Partner_Coupon_Test
 *
 * @package Automattic\Jetpack
 * @covers Automattic\Jetpack\Partner_Coupon
 */
class Partner_Coupon_Test extends BaseTestCase {

	const PRODUCT = array(
		'title'       => 'Jetpack Backup',
		'slug'        => 'jetpack_backup_daily',
		'description' => 'This is quite the product!',
		'features'    => array(
			'Automated daily backups (off-site)',
			'One-click restores',
			'Unlimited backup storage',
		),
	);

	const PARTNER = array(
		'name'   => 'Jetpack Test Partner',
		'prefix' => 'JPTST',
	);

	const PRESET = array(
		'code'    => 'JPTA',
		'product' => 'jetpack_backup_daily',
	);

	/**
	 * Create mock coupon.
	 */
	protected function setup_coupon() {
		add_filter(
			'jetpack_partner_coupon_supported_partners',
			function ( $partners ) {
				return array( self::PARTNER['prefix'] => self::PARTNER['name'] );
			}
		);

		add_filter(
			'jetpack_partner_coupon_supported_presets',
			function ( $presets ) {
				return array( self::PRESET['code'] => self::PRESET['product'] );
			}
		);

		add_filter(
			'jetpack_partner_coupon_products',
			function ( $products ) {
				return array( self::PRODUCT );
			}
		);

		$coupon_code = sprintf( '%s_%s_%s', self::PARTNER['prefix'], self::PRESET['code'], 'abc123' );
		Jetpack_Options::update_option( Partner_Coupon::$coupon_option, $coupon_code );

		return $coupon_code;
	}

	/**
	 * Get Instance: tests the class returns the instance.
	 */
	public function test_get_instance_returns_instance() {
		$this->assertInstanceOf( Partner_Coupon::class, Partner_Coupon::get_instance() );
	}

	/**
	 * Get coupon: success.
	 */
	public function test_get_coupon_success() {
		$coupon_code    = $this->setup_coupon();
		$partner_coupon = Partner_Coupon::get_coupon();

		$this->assertTrue( is_array( $partner_coupon ) );
		$this->assertSame( $partner_coupon['coupon_code'], $coupon_code );
		$this->assertSame( $partner_coupon['partner'], self::PARTNER );
		$this->assertSame( $partner_coupon['preset'], self::PRESET['code'] );
		$this->assertSame( $partner_coupon['product'], self::PRODUCT );
	}

	/**
	 * Get coupon: incorrect partner.
	 */
	public function test_get_coupon_partner_failure() {
		$this->setup_coupon();

		// First we establish that the preset worked before.
		$partner_coupon = Partner_Coupon::get_coupon();
		$this->assertTrue( is_array( $partner_coupon ) );

		// Override supported partners with incorrect data.
		add_filter(
			'jetpack_partner_coupon_supported_partners',
			function ( $partners ) {
				return array( 'UNKNOWN' => self::PARTNER['name'] );
			}
		);

		// Verify that the coupon data is incorrect.
		$partner_coupon = Partner_Coupon::get_coupon();
		$this->assertFalse( $partner_coupon );
	}

	/**
	 * Get coupon: incorrect preset.
	 */
	public function test_get_coupon_preset_failure() {
		$this->setup_coupon();

		// First we establish that the preset worked before.
		$partner_coupon = Partner_Coupon::get_coupon();
		$this->assertTrue( is_array( $partner_coupon ) );

		// Override supported presets with incorrect data.
		add_filter(
			'jetpack_partner_coupon_supported_presets',
			function ( $presets ) {
				return array( 'UNKNOWN' => self::PRESET['product'] );
			}
		);

		// Verify that the coupon data is incorrect.
		$partner_coupon = Partner_Coupon::get_coupon();
		$this->assertFalse( $partner_coupon );
	}

	/**
	 * Get coupon: failure if preset do not match a product.
	 */
	public function test_get_coupon_product_failure() {
		$this->setup_coupon();
		$coupon_code = sprintf( '%s_%s_%s', self::PARTNER['prefix'], self::PRESET['code'], 'abc123' );

		Jetpack_Options::update_option( Partner_Coupon::$coupon_option, $coupon_code );

		// First we establish that the product worked before.
		$partner_coupon = Partner_Coupon::get_coupon();
		$this->assertTrue( is_array( $partner_coupon ) );

		// Modify the product slug so it doesn't match the preset anymore.
		add_filter(
			'jetpack_partner_coupon_products',
			function ( $products ) {
				$products[0]['slug'] = 'Nope!';

				return $products;
			}
		);

		// Verify that the coupon data is incorrect.
		$partner_coupon = Partner_Coupon::get_coupon();
		$this->assertFalse( $partner_coupon );
	}

	/**
	 * Purge coupon: Verify if coupon is purged at expected times.
	 *
	 * @dataProvider dataprovider_purge_dates
	 *
	 * @param int  $added_date Timestamp for added date.
	 * @param bool $purged If we expect the coupon to be purged or not.
	 */
	public function test_purge_coupon( $added_date, $purged ) {
		$this->setup_coupon();
		$coupon_code = sprintf( '%s_%s_%s', self::PARTNER['prefix'], self::PRESET['code'], 'abc123' );

		Jetpack_Options::update_options(
			array(
				Partner_Coupon::$coupon_option => $coupon_code,
				Partner_Coupon::$added_option  => $added_date,
			)
		);

		// Verify that the coupon was correctly added.
		$partner_coupon = Partner_Coupon::get_coupon();
		$this->assertTrue( is_array( $partner_coupon ) );

		// Maybe purge the coupon.
		$instance = Partner_Coupon::get_instance();
		$instance->purge_coupon();

		// Confirm assertion.
		$partner_coupon = Partner_Coupon::get_coupon();

		if ( $purged ) {
			$this->assertFalse( $partner_coupon );
			$this->assertFalse( Jetpack_Options::get_option( Partner_Coupon::$coupon_option, false ) );
			$this->assertFalse( Jetpack_Options::get_option( Partner_Coupon::$added_option, false ) );
		} else {
			$this->assertTrue( is_array( $partner_coupon ) );
		}
	}

	/**
	 * DataProvider: Get purge dates and assertion expectation.
	 *
	 * @return array[]
	 */
	public function dataprovider_purge_dates() {
		return array(
			array(
				strtotime( '-31 days' ),
				true,
			),
			array(
				strtotime( '-30 days' ),
				true,
			),
			array(
				strtotime( '-29 days' ),
				false,
			),
		);
	}

}
