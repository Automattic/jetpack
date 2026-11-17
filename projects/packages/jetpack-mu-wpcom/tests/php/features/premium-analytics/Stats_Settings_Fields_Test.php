<?php
/**
 * Tests for the Stats settings the Settings tab offers on WordPress.com Simple.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\PremiumAnalytics\Stats_Settings;
use PHPUnit\Framework\Attributes\CoversFunction;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/premium-analytics/stats-settings-fields.php';

/**
 * @covers ::wpcom_premium_analytics_simple_stats_settings_fields
 */
#[CoversFunction( 'wpcom_premium_analytics_simple_stats_settings_fields' )]
class Stats_Settings_Fields_Test extends \WorDBless\BaseTestCase {

	public function test_simple_keeps_the_admin_bar_and_reader_settings_on_the_package_filter() {
		$fields = apply_filters( Stats_Settings::FIELDS_FILTER, array( 'admin_bar', 'roles', 'count_roles', 'wpcom_reader_views_enabled', 'consent' ) );

		$this->assertSame( array( 'admin_bar', 'wpcom_reader_views_enabled' ), $fields );
	}
}
