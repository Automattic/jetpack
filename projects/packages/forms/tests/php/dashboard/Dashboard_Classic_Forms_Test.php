<?php
/**
 * Unit Tests for classic forms state detection.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for classic forms state detection in Dashboard.
 *
 * @covers \Automattic\Jetpack\Forms\Dashboard\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Classic_Forms_Test extends BaseTestCase {

	/**
	 * The option name used to store classic forms state.
	 */
	private const OPTION_NAME = 'jetpack_forms_classic_state';

	/**
	 * Shorthand constants for readability.
	 */
	private const STATE_CLASSIC   = Dashboard::CLASSIC_FORMS_STATE_CLASSIC;
	private const STATE_HIDDEN    = Dashboard::CLASSIC_FORMS_STATE_HIDDEN;
	private const STATE_DISMISSED = Dashboard::CLASSIC_FORMS_STATE_DISMISSED;

	/**
	 * Clean up after each test.
	 */
	protected function tear_down() {
		parent::tear_down();
		delete_option( self::OPTION_NAME );
		remove_all_filters( 'wordbless_wpdb_query_results' );
	}

	/**
	 * Simulate detect_classic_forms SQL query returning a result (classic forms found).
	 */
	private function simulate_classic_forms_detected() {
		add_filter(
			'wordbless_wpdb_query_results',
			function ( $results, $query ) {
				if ( strpos( $query, "post_type = 'feedback'" ) !== false && strpos( $query, 'p.ID IS NULL' ) !== false ) {
					return array( (object) array( '1' => '1' ) );
				}
				return $results;
			},
			10,
			2
		);
	}

	/**
	 * Simulate detect_classic_forms SQL query returning no result (no classic forms).
	 */
	private function simulate_no_classic_forms() {
		add_filter(
			'wordbless_wpdb_query_results',
			function ( $results, $query ) {
				if ( strpos( $query, "post_type = 'feedback'" ) !== false && strpos( $query, 'p.ID IS NULL' ) !== false ) {
					return array();
				}
				return $results;
			},
			10,
			2
		);
	}

	/**
	 * Test that when option is not set and no classic feedback posts exist, state is 'hidden'.
	 */
	public function test_no_option_no_classic_feedback_returns_hidden() {
		$this->simulate_no_classic_forms();

		$dashboard = new Dashboard();
		$state     = $dashboard->get_classic_forms_state();

		$this->assertEquals( self::STATE_HIDDEN, $state );
		$this->assertEquals( self::STATE_HIDDEN, get_option( self::OPTION_NAME ) );
	}

	/**
	 * Test that when option is not set and classic feedback exists, state is 'classic'.
	 */
	public function test_no_option_with_classic_feedback_returns_classic() {
		$this->simulate_classic_forms_detected();

		$dashboard = new Dashboard();
		$state     = $dashboard->get_classic_forms_state();

		$this->assertEquals( self::STATE_CLASSIC, $state );
		$this->assertEquals( self::STATE_CLASSIC, get_option( self::OPTION_NAME ) );
	}

	/**
	 * Test that when option is already 'classic', it returns 'classic' without querying.
	 */
	public function test_option_classic_returns_classic() {
		update_option( self::OPTION_NAME, self::STATE_CLASSIC );

		$dashboard = new Dashboard();
		$state     = $dashboard->get_classic_forms_state();

		$this->assertEquals( self::STATE_CLASSIC, $state );
	}

	/**
	 * Test that when option is already 'hidden', it returns 'hidden' without querying.
	 */
	public function test_option_hidden_returns_hidden() {
		update_option( self::OPTION_NAME, self::STATE_HIDDEN );

		$dashboard = new Dashboard();
		$state     = $dashboard->get_classic_forms_state();

		$this->assertEquals( self::STATE_HIDDEN, $state );
	}

	/**
	 * Test that option caching prevents subsequent DB queries.
	 */
	public function test_option_caching_prevents_db_queries() {
		$this->simulate_classic_forms_detected();

		$dashboard = new Dashboard();

		// First call detects classic and caches.
		$state = $dashboard->get_classic_forms_state();
		$this->assertEquals( self::STATE_CLASSIC, $state );

		// Remove the SQL simulation — if option caching works, it won't matter.
		remove_all_filters( 'wordbless_wpdb_query_results' );
		$this->simulate_no_classic_forms();

		// Second call should use cached option, not re-query.
		$state = $dashboard->get_classic_forms_state();
		$this->assertEquals( self::STATE_CLASSIC, $state );
	}

	/**
	 * Test that mark_classic_form_detected sets the option to 'classic'.
	 */
	public function test_mark_classic_form_detected_sets_option() {
		Dashboard::mark_classic_form_detected();

		$this->assertEquals( self::STATE_CLASSIC, get_option( self::OPTION_NAME ) );
	}

	/**
	 * Test that mark_classic_form_detected overwrites 'hidden' with 'classic'.
	 */
	public function test_mark_classic_form_detected_overwrites_hidden() {
		update_option( self::OPTION_NAME, self::STATE_HIDDEN );

		Dashboard::mark_classic_form_detected();

		$this->assertEquals( self::STATE_CLASSIC, get_option( self::OPTION_NAME ) );
	}

	/**
	 * Test that get_classic_forms_state returns 'classic' after mark is called.
	 */
	public function test_get_state_after_mark_returns_classic() {
		Dashboard::mark_classic_form_detected();

		$dashboard = new Dashboard();
		$state     = $dashboard->get_classic_forms_state();

		$this->assertEquals( self::STATE_CLASSIC, $state );
	}

	/**
	 * Test that when option is 'dismissed', it returns 'dismissed' without querying.
	 */
	public function test_option_dismissed_returns_dismissed() {
		update_option( self::OPTION_NAME, self::STATE_DISMISSED );

		$dashboard = new Dashboard();
		$state     = $dashboard->get_classic_forms_state();

		$this->assertEquals( self::STATE_DISMISSED, $state );
	}

	/**
	 * Test that 'dismissed' state is not treated as 'classic' by the config endpoint.
	 */
	public function test_dismissed_state_is_not_classic() {
		update_option( self::OPTION_NAME, self::STATE_DISMISSED );

		$dashboard = new Dashboard();
		$state     = $dashboard->get_classic_forms_state();

		$this->assertNotEquals( self::STATE_CLASSIC, $state );
	}

	/**
	 * Test that mark_classic_form_detected does not overwrite 'dismissed'.
	 */
	public function test_mark_classic_form_detected_does_not_overwrite_dismissed() {
		update_option( self::OPTION_NAME, self::STATE_DISMISSED );

		Dashboard::mark_classic_form_detected();

		$this->assertEquals( self::STATE_DISMISSED, get_option( self::OPTION_NAME ) );
	}
}
