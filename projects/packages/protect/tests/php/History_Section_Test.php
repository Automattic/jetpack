<?php
/**
 * Tests for the Protect dashboard's History section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Protect\Sections\History;
use Automattic\Jetpack\Protect\Sections\Scan;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Sections\History
 */
#[CoversClass( History::class )]
class History_Section_Test extends BaseTestCase {

	/**
	 * Drop the seeded history between tests.
	 */
	public function tear_down() {
		delete_transient( Scan::HISTORY_CACHE );
		parent::tear_down();
	}

	/**
	 * Test that a site without Scan gets no history, even one already cached.
	 */
	public function test_history_needs_a_scan_plan() {
		set_transient(
			Scan::HISTORY_CACHE,
			array(
				array(
					'id'     => 1,
					'status' => 'fixed',
				),
			)
		);

		$history = History::get_history();

		$this->assertInstanceOf( \WP_Error::class, $history );
		$this->assertSame( 'no_scan_plan', $history->get_error_code() );
		$this->assertSame( 403, $history->get_error_data()['status'] );
	}
}
