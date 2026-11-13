<?php
/**
 * Tests for passing the Jetpack random redirect filter on to WordPress core.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/../../../../modules/theme-tools/random-redirect-core-compat.php';

/**
 * Test class for the Random Redirect core compatibility bridge.
 */
class Random_Redirect_Core_Compat_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Remove the Jetpack filter callbacks a test added.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_random_redirect_enabled' );
		parent::tear_down();
	}

	/**
	 * Data provider for test_core_filter_value.
	 *
	 * @return array
	 */
	public static function provide_core_filter_value() {
		return array(
			'Jetpack opt-out turns core off'      => array( '__return_false', true, false ),
			'Jetpack cannot re-enable core'       => array( '__return_true', false, false ),
			'No Jetpack callback leaves core on'  => array( null, true, true ),
			'No Jetpack callback leaves core off' => array( null, false, false ),
		);
	}

	/**
	 * The Jetpack filter can turn core's random content redirects off, but never back on.
	 *
	 * @dataProvider provide_core_filter_value
	 *
	 * @param callable|null $jetpack_callback Callback for jetpack_random_redirect_enabled, if any.
	 * @param bool          $core_input       Value core's filter receives.
	 * @param bool          $expected         Value core's filter should return.
	 */
	#[DataProvider( 'provide_core_filter_value' )]
	public function test_core_filter_value( $jetpack_callback, $core_input, $expected ) {
		if ( $jetpack_callback ) {
			add_filter( 'jetpack_random_redirect_enabled', $jetpack_callback );
		}

		$this->assertSame( $expected, apply_filters( 'wp_enable_random_content_redirect', $core_input ) );
	}
}
