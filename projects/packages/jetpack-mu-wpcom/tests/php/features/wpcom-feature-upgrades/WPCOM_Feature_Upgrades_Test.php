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
	 * Monetize's upgrade goes to the plan upgrade flow, which returns to the linking page on this site.
	 *
	 * @dataProvider provide_monetize_back_urls
	 *
	 * @param string $back_url The page the link is on; `admin:` prefixes a wp-admin path.
	 * @param string $expected How the flow's `back_to` and `redirect_to` should end.
	 */
	#[DataProvider( 'provide_monetize_back_urls' )]
	public function test_monetize_upgrade_goes_to_the_plan_upgrade_flow( $back_url, $expected ) {
		if ( str_starts_with( $back_url, 'admin:' ) ) {
			$back_url = admin_url( substr( $back_url, 6 ) );
		}

		$upgrade = WPCOM_Feature_Upgrades::filter_monetize_upgrade( array( 'back_url' => $back_url ), WPCOM_Feature_Upgrades::MONETIZE_SLUG );
		parse_str( (string) wp_parse_url( $upgrade['url'], PHP_URL_QUERY ), $query );

		$this->assertStringStartsWith( 'https://wordpress.com/setup/plan-upgrade?', $upgrade['url'] );
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
			'no page'      => array( '', '/wp-admin/admin.php?page=jetpack-monetize' ),
			'another site' => array( 'https://example.net/wp-admin/', '/wp-admin/admin.php?page=jetpack-monetize' ),
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
