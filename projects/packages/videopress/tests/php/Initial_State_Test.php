<?php
/**
 * Tests for VideoPress dashboard entitlement state.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\My_Jetpack\Product;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Tests for dashboard entitlement state.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Initial_State_Test extends BaseTestCase {

	/**
	 * Clean up the site-features cache.
	 */
	public function tearDown(): void {
		delete_transient( Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY );
		parent::tearDown();
	}

	/**
	 * Check that failed feature requests cannot classify a site as free.
	 */
	public function test_failed_features_remain_unknown() {
		set_transient( Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY, new WP_Error( 'site_features_fetch_failed' ), 15 );

		$this->assertNull( Initial_State::has_videopress_access() );
	}

	/**
	 * Check known free and paid feature lists.
	 *
	 * @dataProvider known_features_provider
	 * @param array $active Active site features.
	 * @param bool  $expected Expected paid entitlement.
	 */
	#[DataProvider( 'known_features_provider' )]
	public function test_known_features( $active, $expected ) {
		set_transient( Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY, array( 'active' => $active ), 15 );

		$this->assertSame( $expected, Initial_State::has_videopress_access() );
	}

	/**
	 * Known site-feature combinations.
	 *
	 * @return array Test cases.
	 */
	public static function known_features_provider() {
		return array(
			'free'      => array( array(), false ),
			'paid'      => array( array( 'videopress-1tb-storage' ), true ),
			'unlimited' => array( array( 'videopress-unlimited-storage' ), true ),
		);
	}
}
