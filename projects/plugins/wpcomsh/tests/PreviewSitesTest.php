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
		$this->assertFalse( wpcomsh_is_preview_site() );

		Atomic_Persistent_Data::set( 'WPCOM_IS_PREVIEW_SITE', '1' );
		$this->assertTrue( wpcomsh_is_preview_site() );

		$purchase = array(
			'product_slug' => 'business-bundle',
			'expiry_date'  => ( new DateTime() )->add( new DateInterval( 'P1Y' ) )->format( 'c' ),
		);
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $purchase ), JSON_UNESCAPED_SLASHES ) );
		$this->assertFalse( wpcomsh_is_preview_site() );
	}

	/**
	 * The owner of a preview is asked to choose a plan; other visitors without a share link see nothing.
	 */
	public function test_banner_shows_the_owner_of_a_preview_a_plans_link() {
		$render = function () {
			ob_start();
			wpcomsh_preview_site_banner();
			return ob_get_clean();
		};

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->assertSame( '', $render(), 'Not a preview' );

		Atomic_Persistent_Data::set( 'WPCOM_IS_PREVIEW_SITE', '1' );
		$this->assertStringContainsString( 'https://wordpress.com/plans/', $render() );

		wp_set_current_user( 0 );
		$this->assertSame( '', $render(), 'Not the owner' );
	}
}
