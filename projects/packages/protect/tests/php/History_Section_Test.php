<?php
/**
 * Tests for the Protect dashboard's History section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Protect\Sections\History;
use Automattic\Jetpack\Protect\Sections\Scan;
use Automattic\Jetpack\Protect_Status\Ignored_Vulnerabilities;
use Automattic\Jetpack\Protect_Status\Protect_Status;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Sections\History
 */
#[CoversClass( History::class )]
class History_Section_Test extends BaseTestCase {
	use Plugin_Cache;

	/**
	 * Drop the seeded history between tests.
	 */
	public function tear_down() {
		delete_transient( Scan::HISTORY_CACHE );
		delete_option( \Automattic\Jetpack\Current_Plan::SITE_PRODUCTS_OPTION );
		\Automattic\Jetpack\Protect_Status\Plan::has_required_plan( true );
		delete_option( Protect_Status::OPTION_NAME );
		delete_option( Protect_Status::OPTION_TIMESTAMP_NAME );
		Protect_Status::$status = null;
		Ignored_Vulnerabilities::delete_option();
		self::clear_plugin_cache();
		parent::tear_down();
	}

	/**
	 * Test that a free site's history is only its ignored threats, and a Scan site's is not.
	 */
	public function test_history_needs_a_scan_plan_or_free_ignore() {
		set_transient(
			Scan::HISTORY_CACHE,
			array(
				array(
					'id'     => 1,
					'status' => 'fixed',
				),
			)
		);
		self::seed_plugin_cache(
			array(
				'akismet/akismet.php' => array(
					'Name'    => 'Akismet',
					'Version' => '1.0',
				),
			)
		);
		update_option(
			Protect_Status::OPTION_NAME,
			(object) array(
				'last_checked' => '2026-11-05 10:00:00',
				'plugins'      => (object) array(
					'akismet/akismet.php' => (object) array(
						'slug'            => 'akismet/akismet.php',
						'name'            => 'Akismet',
						'version'         => '1.0',
						'checked'         => true,
						'vulnerabilities' => array(
							(object) array(
								'id'       => 'vuln-1',
								'title'    => 'XSS in Akismet',
								'fixed_in' => '1.1',
							),
						),
					),
				),
			)
		);
		update_option( Protect_Status::OPTION_TIMESTAMP_NAME, time() + HOUR_IN_SECONDS );

		// A free site's history is its ignored list; the cached fixed threat is not shown.
		Ignored_Vulnerabilities::ignore( Protect_Status::get_status()->threats[0] );
		$history = History::get_history();
		$this->assertSame( array( 'ignored' ), array_column( $history, 'status' ) );
		$this->assertTrue( ( new History() )->get_state()['freeIgnore'] );

		update_option( \Automattic\Jetpack\Current_Plan::SITE_PRODUCTS_OPTION, array( array( 'product_slug' => 'jetpack_scan' ) ) );
		\Automattic\Jetpack\Protect_Status\Plan::has_required_plan( true );
		$this->assertFalse( ( new History() )->get_state()['freeIgnore'] );
	}
}
