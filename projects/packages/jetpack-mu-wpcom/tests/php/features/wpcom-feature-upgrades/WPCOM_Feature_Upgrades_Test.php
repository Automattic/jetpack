<?php
/**
 * Tests for WPCOM_Feature_Upgrades.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Feature_Upgrades;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Feature_Upgrades
 */
#[CoversClass( WPCOM_Feature_Upgrades::class )]
class WPCOM_Feature_Upgrades_Test extends \WorDBless\BaseTestCase {

	/**
	 * Monetize's upgrade offers the plans with ads, and returns to the linking page on this site.
	 *
	 * @dataProvider provide_monetize_back_urls
	 *
	 * @param string|null $back_url The page the link is on, `admin:` prefixing a wp-admin path, or null for none.
	 * @param string      $expected How the flow's `back_to` and `redirect_to` should end.
	 */
	#[DataProvider( 'provide_monetize_back_urls' )]
	public function test_monetize_upgrade_goes_to_the_plan_upgrade_flow( $back_url, $expected ) {
		$upgrade = WPCOM_Feature_Upgrades::filter_monetize_upgrade(
			null === $back_url ? array() : array( 'back_url' => admin_url( substr( $back_url, 6 ) ) ),
			WPCOM_Feature_Upgrades::MONETIZE_SLUG
		);
		parse_str( (string) wp_parse_url( $upgrade['url'], PHP_URL_QUERY ), $query );

		$this->assertStringStartsWith( 'https://wordpress.com/setup/plan-upgrade?', $upgrade['url'] );
		$this->assertSame( 'wordads-instant', $query['feature'] );
		$this->assertStringEndsWith( $expected, $query['back_to'] );
		$this->assertSame( $query['back_to'], $query['redirect_to'] );
	}

	/**
	 * Data provider for test_monetize_upgrade_goes_to_the_plan_upgrade_flow.
	 *
	 * @return array[]
	 */
	public static function provide_monetize_back_urls() {
		return array(
			'from a tab' => array( 'admin:admin.php?page=jetpack-monetize&p=%2F%3Ftab%3Dads', '/wp-admin/admin.php?page=jetpack-monetize&p=%2F%3Ftab%3Dads' ),
			'no page'    => array( null, '/wp-admin/admin.php?page=jetpack-monetize' ),
		);
	}

	/**
	 * @dataProvider provide_sites_without_purchases
	 *
	 * @param string $option The option that marks the site.
	 */
	#[DataProvider( 'provide_sites_without_purchases' )]
	public function test_monetize_upgrade_offers_nothing_where_the_site_cannot_buy( $option ) {
		update_option( $option, 1 );

		$upgrade = WPCOM_Feature_Upgrades::filter_monetize_upgrade( array( 'name' => 'Jetpack Creator' ), WPCOM_Feature_Upgrades::MONETIZE_SLUG );

		$this->assertSame( '', $upgrade['url'] );
	}

	/**
	 * Data provider for test_monetize_upgrade_offers_nothing_where_the_site_cannot_buy.
	 *
	 * @return array[]
	 */
	public static function provide_sites_without_purchases() {
		return array(
			'staging site' => array( 'wpcom_is_staging_site' ),
			'agency site'  => array( 'is_fully_managed_agency_site' ),
		);
	}

	/**
	 * Other features keep the upgrade they were given.
	 */
	public function test_monetize_upgrade_leaves_other_features_alone() {
		$upgrade = array( 'path' => '/add-boost' );

		$this->assertSame( $upgrade, WPCOM_Feature_Upgrades::filter_monetize_upgrade( $upgrade, 'boost' ) );
	}
}
