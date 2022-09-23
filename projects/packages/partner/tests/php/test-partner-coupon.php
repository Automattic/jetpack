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
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;

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
		'logo'   => array(
			'src'    => '/images/ionos-logo.jpg',
			'width'  => 119,
			'height' => 32,
		),
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
				return array(
					self::PARTNER['prefix'] => array(
						'name' => self::PARTNER['name'],
						'logo' => self::PARTNER['logo'],
					),
				);
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

		$this->assertIsArray( $partner_coupon );
		$this->assertSame( $coupon_code, $partner_coupon['coupon_code'] );
		$this->assertSame( self::PARTNER, $partner_coupon['partner'] );
		$this->assertSame( self::PRESET['code'], $partner_coupon['preset'] );
		$this->assertSame( self::PRODUCT, $partner_coupon['product'] );
	}

	/**
	 * Get coupon: incorrect partner.
	 */
	public function test_get_coupon_partner_failure() {
		$this->setup_coupon();

		// First we establish that the preset worked before.
		$partner_coupon = Partner_Coupon::get_coupon();
		$this->assertIsArray( $partner_coupon );

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
		$this->assertIsArray( $partner_coupon );

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
		$this->assertIsArray( $partner_coupon );

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
	public function test_maybe_purge_coupon_by_added_date( $added_date, $purged ) {
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
		$this->assertIsArray( $partner_coupon );

		// Maybe purge the coupon.
		$instance = Partner_Coupon::get_instance();
		$class    = new \ReflectionClass( $instance );
		$method   = $class->getMethod( 'maybe_purge_coupon_by_added_date' );
		$method->setAccessible( true );
		$method->invoke( $instance );

		// Confirm assertion.
		$partner_coupon = Partner_Coupon::get_coupon();

		if ( $purged ) {
			$this->assertFalse( $partner_coupon );
			$this->assertFalse( Jetpack_Options::get_option( Partner_Coupon::$coupon_option, false ) );
			$this->assertFalse( Jetpack_Options::get_option( Partner_Coupon::$added_option, false ) );
		} else {
			$this->assertIsArray( $partner_coupon );
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

	/**
	 * Purge coupon: verify remote availability check is respected.
	 *
	 * @dataProvider dataprovider_availability_check_scenarios
	 *
	 * @param array $mock_response Data used to mock response.
	 * @param bool  $expectation The expected assertion result.
	 */
	public function test_maybe_purge_coupon_by_availability_check( $mock_response, $expectation ) {
		$this->setup_coupon();
		$coupon_code = sprintf( '%s_%s_%s', self::PARTNER['prefix'], self::PRESET['code'], 'abc123' );

		Jetpack_Options::update_options(
			array(
				Partner_Coupon::$coupon_option => $coupon_code,
				Partner_Coupon::$added_option  => time(),
				'id'                           => 123,
			)
		);

		if ( isset( $mock_response['body'] ) ) {
			$mock_response['body'] = wp_json_encode( $mock_response['body'] );
		}

		$mock_client = $this->getMockBuilder( \stdClass::class )
							->setMethods( array( 'wpcom_json_api_request_as_blog' ) )
							->getMock();

		$mock_client
			->expects( $this->once() )
			->method( 'wpcom_json_api_request_as_blog' )
			->willReturn( $mock_response );

		$instance = new Partner_Coupon( array( $mock_client, 'wpcom_json_api_request_as_blog' ) );
		$class    = new \ReflectionClass( $instance );
		$method   = $class->getMethod( 'maybe_purge_coupon_by_availability_check' );
		$method->setAccessible( true );
		$status = $method->invoke( $instance );

		$this->assertSame( $status, $expectation );
	}

	/**
	 * DataProvider: Remote availability data and expectations.
	 *
	 * @return array[]
	 */
	public function dataprovider_availability_check_scenarios() {
		return array(
			'successful remote request | unavailable coupon' => array(
				array(
					'body'     => array( 'available' => false ),
					'response' => array( 'code' => 200 ),
				),
				true,
			),
			'successful remote request | available coupon' => array(
				array(
					'body'     => array( 'available' => true ),
					'response' => array( 'code' => 200 ),
				),
				false,
			),
			'unsuccessful remote request | 401'            => array(
				array(
					'response' => array( 'code' => 401 ),
				),
				false,
			),
			'unsuccessful remote request | 404'            => array(
				array(
					'response' => array( 'code' => 404 ),
				),
				false,
			),
			'unsuccessful remote request | 408'            => array(
				array(
					'response' => array( 'code' => 408 ),
				),
				false,
			),
			'unsuccessful remote request | 500'            => array(
				array(
					'response' => array( 'code' => 500 ),
				),
				false,
			),
		);
	}

}
