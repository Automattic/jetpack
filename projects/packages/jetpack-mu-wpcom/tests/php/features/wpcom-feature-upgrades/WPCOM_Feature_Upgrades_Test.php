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
		if ( null !== $back_url && str_starts_with( $back_url, 'admin:' ) ) {
			$back_url = admin_url( substr( $back_url, 6 ) );
		}

		$upgrade = WPCOM_Feature_Upgrades::filter_monetize_upgrade(
			null === $back_url ? array() : array( 'back_url' => $back_url ),
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
			'from a tab'   => array( 'admin:admin.php?page=jetpack-monetize&p=%2F%3Ftab%3Dads', '/wp-admin/admin.php?page=jetpack-monetize&p=%2F%3Ftab%3Dads' ),
			'no page'      => array( null, '/wp-admin/admin.php?page=jetpack-monetize' ),
			'another site' => array( 'https://example.net/wp-admin/', '/wp-admin/admin.php?page=jetpack-monetize' ),
		);
	}

	/**
	 * A site that can't buy a plan gets no upgrade for what WordPress.com routes, and Jetpack's own for the rest.
	 *
	 * @dataProvider provide_upgrades_on_sites_without_purchases
	 *
	 * @param string      $option   The option that marks the site.
	 * @param string      $filter   The filter method under test.
	 * @param string      $slug     The feature slug.
	 * @param string|null $expected The upgrade's `url`, or null when the upgrade is left as given.
	 */
	#[DataProvider( 'provide_upgrades_on_sites_without_purchases' )]
	public function test_upgrade_offers_nothing_where_the_site_cannot_buy( $option, $filter, $slug, $expected ) {
		update_option( $option, 1 );

		$upgrade = WPCOM_Feature_Upgrades::$filter(
			array(
				'path' => '/add-' . $slug,
				'name' => 'Jetpack',
			),
			$slug,
			false
		);

		$this->assertSame( $expected, $upgrade['url'] ?? null );
	}

	/**
	 * Data provider for test_upgrade_offers_nothing_where_the_site_cannot_buy.
	 *
	 * @return array[]
	 */
	public static function provide_upgrades_on_sites_without_purchases() {
		return array(
			'Monetize page, staging site' => array( 'wpcom_is_staging_site', 'filter_monetize_upgrade', WPCOM_Feature_Upgrades::MONETIZE_SLUG, '' ),
			'Monetize page, agency site'  => array( 'is_fully_managed_agency_site', 'filter_monetize_upgrade', WPCOM_Feature_Upgrades::MONETIZE_SLUG, '' ),
			'Backup, staging site'        => array( 'wpcom_is_staging_site', 'filter_feature_upgrade', 'backup', '' ),
			'Social, agency site'         => array( 'is_fully_managed_agency_site', 'filter_feature_upgrade', 'social', '' ),
			'Boost, staging site'         => array( 'wpcom_is_staging_site', 'filter_feature_upgrade', 'boost', null ),
		);
	}

	/**
	 * A feature with no hosting page goes to the plans that include it, and comes back to the page the link was on.
	 *
	 * @dataProvider provide_plan_feature_upgrades
	 *
	 * @param string $slug    The My Jetpack feature slug.
	 * @param string $feature The plan feature the flow filters on, '' for none.
	 */
	#[DataProvider( 'provide_plan_feature_upgrades' )]
	public function test_feature_upgrade_goes_to_the_plans_with_the_feature( $slug, $feature ) {
		$back    = admin_url( 'admin.php?page=my-jetpack#/features' );
		$upgrade = WPCOM_Feature_Upgrades::filter_feature_upgrade(
			array(
				'path'     => '/add-' . $slug,
				'name'     => 'Jetpack',
				'back_url' => $back,
			),
			$slug,
			false
		);
		parse_str( (string) wp_parse_url( $upgrade['url'], PHP_URL_QUERY ), $query );

		$this->assertSame( '', $upgrade['path'] );
		$this->assertStringStartsWith( 'https://wordpress.com/setup/plan-upgrade?', $upgrade['url'] );
		$this->assertSame( $feature, $query['feature'] ?? '' );
		$this->assertSame( $back, $query['back_to'] );
		$this->assertSame( $back, $query['redirect_to'] );
	}

	/**
	 * Data provider for test_feature_upgrade_goes_to_the_plans_with_the_feature.
	 *
	 * @return array[]
	 */
	public static function provide_plan_feature_upgrades() {
		return array(
			'Social'           => array( 'social', 'republicize' ),
			'Podcast'          => array( 'podcast', '' ),
			'Monetize'         => array( 'monetize', 'wordads-instant' ),
			'Google Analytics' => array( 'google-analytics', 'google-analytics' ),
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
