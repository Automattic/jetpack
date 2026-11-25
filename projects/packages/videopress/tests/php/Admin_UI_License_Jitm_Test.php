<?php
/**
 * Tests for the license activation JITM filter on the VideoPress page.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\My_Jetpack\Product;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for Admin_UI::remove_license_activation_jitms().
 */
class Admin_UI_License_Jitm_Test extends BaseTestCase {

	const VIDEOPRESS_PATH = 'wp:jetpack_page_jetpack-videopress:admin_notices';

	/**
	 * Clean up the site-features cache.
	 */
	public function tearDown(): void {
		delete_transient( Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY );
		parent::tearDown();
	}

	/**
	 * Check which JITMs survive for each page and plan.
	 *
	 * @dataProvider cases_provider
	 * @param string $message_path    Requested message path.
	 * @param array  $active_features Active site features.
	 * @param array  $expected_ids    JITM ids left after filtering.
	 */
	#[DataProvider( 'cases_provider' )]
	public function test_filters_license_jitms( $message_path, $active_features, $expected_ids ) {
		set_transient( Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY, array( 'active' => $active_features ), 15 );
		$envelopes = array(
			(object) array( 'id' => 'multiple_licensing_activation_notice' ),
			(object) array( 'id' => 'single_licensing_activation_notice' ),
			(object) array( 'id' => 'backup-upsell' ),
		);

		$result = Admin_UI::remove_license_activation_jitms( $envelopes, $message_path );

		$this->assertSame( $expected_ids, wp_list_pluck( $result, 'id' ) );
	}

	/**
	 * Pages and plans to check.
	 *
	 * @return array Test cases.
	 */
	public static function cases_provider() {
		$all = array( 'multiple_licensing_activation_notice', 'single_licensing_activation_notice', 'backup-upsell' );

		return array(
			'free VideoPress page' => array( self::VIDEOPRESS_PATH, array(), array( 'backup-upsell' ) ),
			'paid VideoPress page' => array( self::VIDEOPRESS_PATH, array( 'videopress-1tb-storage' ), $all ),
			'free My Jetpack page' => array( 'wp:jetpack_page_my-jetpack:admin_notices', array(), $all ),
		);
	}
}
