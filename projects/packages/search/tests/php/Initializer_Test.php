<?php
/**
 * Tests for the Initializer class.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Unit tests for the Initializer class.
 */
class Initializer_Test extends Search_TestCase {

	public function test_init_fires_abort_action_when_package_filter_returns_false() {
		$abort_reasons = array();
		add_action(
			'jetpack_search_abort',
			function ( $reason ) use ( &$abort_reasons ) {
				$abort_reasons[] = $reason;
			}
		);
		add_filter( 'jetpack_search_init_search_package', '__return_false' );

		Initializer::init();

		remove_filter( 'jetpack_search_init_search_package', '__return_false' );

		$this->assertContains( 'jetpack_search_init_search_package_filter', $abort_reasons );
	}

	public function test_init_does_not_proceed_past_abort_when_filter_returns_false() {
		// Verify that init() bails early and never reaches is_connected() / is_search_supported(),
		// which would require a live connection.  We confirm by checking that no
		// additional abort actions fire (those come from later guard clauses).
		$reasons = array();
		add_action(
			'jetpack_search_abort',
			function ( $reason ) use ( &$reasons ) {
				$reasons[] = $reason;
			}
		);
		add_filter( 'jetpack_search_init_search_package', '__return_false' );

		Initializer::init();

		remove_filter( 'jetpack_search_init_search_package', '__return_false' );

		// Only the filter-abort reason should have fired.
		$this->assertSame( array( 'jetpack_search_init_search_package_filter' ), $reasons );
	}

	public function test_initialize_deprecated_returns_wp_error() {
		$result = Initializer::initialize();
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid-method', $result->get_error_code() );
		$this->assertSame( 405, $result->get_error_data()['status'] );
	}
}
