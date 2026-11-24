<?php
/**
 * Error reporting tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/error-reporting/error-reporting.php';

/**
 * Tests for the wp-admin error reporting handlers.
 */
class Error_Reporting_Test extends \WorDBless\BaseTestCase {
	/**
	 * Reset the delegation filter.
	 */
	public function tear_down() {
		remove_all_filters( 'wpcom_error_reporting_delegated' );

		parent::tear_down();
	}

	/**
	 * The buffered handler is what reaches the page before the reporting script loads, so a
	 * screen that reports for itself must not get it either.
	 */
	public function test_the_head_handler_stands_down_for_a_screen_that_reports_for_itself() {
		add_filter( 'wpcom_error_reporting_delegated', '__return_true' );

		ob_start();
		wpcom_head_error_handler();

		$this->assertSame( '', ob_get_clean() );
	}

	public function test_the_head_handler_listens_on_every_other_screen() {
		ob_start();
		wpcom_head_error_handler();

		$this->assertStringContainsString( '_headJsErrorHandler', (string) ob_get_clean() );
	}
}
