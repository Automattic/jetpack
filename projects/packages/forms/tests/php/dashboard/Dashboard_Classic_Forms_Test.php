<?php
/**
 * Unit Tests for classic forms state detection.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
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
	 * Query stubs this test registered on `wordbless_wpdb_query_results`.
	 *
	 * @var callable[]
	 */
	private $query_stubs = array();

	/**
	 * Clean up after each test.
	 */
	protected function tear_down() {
		$this->remove_query_stubs();
		delete_option( self::OPTION_NAME );
		parent::tear_down();
	}

	/**
	 * Remove the query stubs this test registered.
	 *
	 * Only the stubs registered here: `wordbless_wpdb_query_results` is how
	 * WorDBless answers every query in the suite, so clearing the whole hook
	 * takes its options, posts, users and meta down with it.
	 */
	private function remove_query_stubs() {
		foreach ( $this->query_stubs as $stub ) {
			remove_filter( 'wordbless_wpdb_query_results', $stub, 10 );
		}
		$this->query_stubs = array();
	}

	/**
	 * Simulate detect_classic_forms SQL query returning a result (classic forms found).
	 */
	private function simulate_classic_forms_detected() {
		$stub = function ( $results, $query ) {
			if ( strpos( $query, "post_type = 'feedback'" ) !== false && strpos( $query, 'p.ID IS NULL' ) !== false ) {
				return array( (object) array( '1' => '1' ) );
			}
			return $results;
		};

		$this->query_stubs[] = $stub;
		add_filter( 'wordbless_wpdb_query_results', $stub, 10, 2 );
	}

	/**
	 * Simulate detect_classic_forms SQL query returning no result (no classic forms).
	 */
	private function simulate_no_classic_forms() {
		$stub = function ( $results, $query ) {
			if ( strpos( $query, "post_type = 'feedback'" ) !== false && strpos( $query, 'p.ID IS NULL' ) !== false ) {
				return array();
			}
			return $results;
		};

		$this->query_stubs[] = $stub;
		add_filter( 'wordbless_wpdb_query_results', $stub, 10, 2 );
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
		$this->remove_query_stubs();
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

	/**
	 * Data provider for test_shell_landing_subtitle_follows_the_classic_forms_state.
	 *
	 * @return array[] Stored state, whether detection finds classic forms, expected subtitle.
	 */
	public static function provide_landing_subtitle_states() {
		$short = 'View and manage all your forms.';
		$long  = 'View and manage all your forms in one place.';
		return array(
			'unset, classic forms found' => array( false, true, $long ),
			'unset, none found'          => array( false, false, $long ),
			'classic'                    => array( self::STATE_CLASSIC, false, $short ),
			'dismissed'                  => array( self::STATE_DISMISSED, true, $long ),
		);
	}

	/**
	 * The admin shell's Forms subtitle reads the stored classic forms state, and never detects or stores it.
	 *
	 * @dataProvider provide_landing_subtitle_states
	 *
	 * @param string|false $stored   Stored classic forms state.
	 * @param bool         $detected Whether detection finds classic forms.
	 * @param string       $expected Expected subtitle.
	 */
	#[DataProvider( 'provide_landing_subtitle_states' )]
	public function test_shell_landing_subtitle_follows_the_classic_forms_state( $stored, $detected, $expected ) {
		if ( $stored ) {
			update_option( self::OPTION_NAME, $stored );
		}
		if ( $detected ) {
			$this->simulate_classic_forms_detected();
		} else {
			$this->simulate_no_classic_forms();
		}
		$flags = static function ( $flags ) {
			return array( 'central-form-management' => true ) + $flags;
		};
		add_filter( 'jetpack_block_editor_feature_flags', $flags );
		$method = new \ReflectionMethod( Dashboard::class, 'landing_subtitle' );
		if ( \PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		try {
			$this->assertSame( $expected, $method->invoke( null ) );
			$this->assertSame( $stored, get_option( self::OPTION_NAME ) );
		} finally {
			remove_filter( 'jetpack_block_editor_feature_flags', $flags );
		}
	}
}
