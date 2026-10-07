<?php
/**
 * Tests for wpcom_launchpad_is_no_guidance().
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/common/launchpad-no-guidance.php';

/**
 * Class Launchpad_No_Guidance_Test
 */
class Launchpad_No_Guidance_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tear down each test.
	 */
	public function tear_down() {
		delete_option( 'wpcom_ai_launchpad_no_guidance' );
		delete_option( 'wpcom_ai_launchpad_enabled' );
		delete_option( 'wpcom_ai_launchpad_dismissed' );

		parent::tear_down();
	}

	/**
	 * @dataProvider provide_option_states
	 *
	 * @param bool $no_guidance Whether wpcom_ai_launchpad_no_guidance is set.
	 * @param bool $enabled     Whether wpcom_ai_launchpad_enabled is set.
	 * @param bool $dismissed   Whether wpcom_ai_launchpad_dismissed is set.
	 * @param bool $expected    Expected result.
	 */
	#[DataProvider( 'provide_option_states' )]
	public function test_is_no_guidance( $no_guidance, $enabled, $dismissed, $expected ) {
		if ( $no_guidance ) {
			update_option( 'wpcom_ai_launchpad_no_guidance', 1 );
		}
		if ( $enabled ) {
			update_option( 'wpcom_ai_launchpad_enabled', 1 );
		}
		if ( $dismissed ) {
			update_option( 'wpcom_ai_launchpad_dismissed', 1 );
		}

		$this->assertSame( $expected, wpcom_launchpad_is_no_guidance() );
	}

	/**
	 * Data provider for test_is_no_guidance.
	 *
	 * @return array
	 */
	public static function provide_option_states() {
		return array(
			'neither set'           => array( false, false, false, false ),
			'no_guidance set'       => array( true, false, false, true ),
			'enabled and dismissed' => array( false, true, true, true ),
			'enabled only'          => array( false, true, false, false ),
			'dismissed only'        => array( false, false, true, false ),
		);
	}
}
