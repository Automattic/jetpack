<?php
/**
 * Preview sites test file.
 *
 * @package wpcomsh
 */

/**
 * Class PreviewSitesTest.
 */
class PreviewSitesTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function tearDown(): void {
		Atomic_Persistent_Data::delete( 'WPCOM_IS_PREVIEW_SITE' );
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );
		parent::tearDown();
	}

	/**
	 * The mark makes the site a preview only while it has no purchases.
	 */
	public function test_mark_counts_only_without_purchases() {
		$this->assertFalse( (bool) get_option( 'wpcom_is_preview_site' ) );

		Atomic_Persistent_Data::set( 'WPCOM_IS_PREVIEW_SITE', '1' );
		$this->assertTrue( get_option( 'wpcom_is_preview_site' ) );

		$purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->add( new DateInterval( 'P1Y' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $purchase ), JSON_UNESCAPED_SLASHES ) );
		$this->assertFalse( get_option( 'wpcom_is_preview_site' ) );
	}
}
