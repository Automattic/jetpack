<?php
/**
 * Tests for the history that Speed_Score_Request writes when a run completes.
 *
 * @package automattic/jetpack-boost-speed-score
 */

namespace Automattic\Jetpack\Boost_Speed_Score\Tests\Lib;

use Automattic\Jetpack\Boost_Core\Contracts\Boost_API_Client;
use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack\Boost_Core\Lib\Transient;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_History;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Request;
use Automattic\Jetpack\Boost_Speed_Score\Tests\Base_TestCase;
use Brain\Monkey\Functions;

/**
 * Class Speed_Score_Request_Test
 *
 * @package Automattic\Jetpack\Boost_Speed_Score\Tests\Lib
 */
class Speed_Score_Request_Test extends Base_TestCase {

	const URL = 'http://example.com';

	/**
	 * Options, keyed by option name. Stands in for the options table.
	 *
	 * @var array
	 */
	public $options = array();

	/**
	 * The $autoload argument each option was last written with, keyed by option name.
	 *
	 * @var array
	 */
	public $autoload = array();

	/**
	 * Name the stubbed wp_get_theme() reports. Change it to simulate a theme switch.
	 *
	 * @var string
	 */
	public $theme_name = 'Twenty Twenty-Four';

	/**
	 * The response the stubbed API client returns when the request polls for an update.
	 *
	 * @var array
	 */
	public $api_response = array();

	/**
	 * Set up the WordPress and Boost API stubs this test needs.
	 */
	protected function set_up() {
		parent::set_up();

		$this->options      = array();
		$this->autoload     = array();
		$this->theme_name   = 'Twenty Twenty-Four';
		$this->api_response = array();

		// Name aware, unlike the stub in Speed_Score_History_Test. This test touches more than
		// one option, so a single shared value would hide which one was written.
		Functions\when( 'get_option' )->alias(
			function ( $name, $default_value = false ) {
				return array_key_exists( $name, $this->options ) ? $this->options[ $name ] : $default_value;
			}
		);

		Functions\when( 'update_option' )->alias(
			function ( $name, $value, $autoload = null ) {
				$this->options[ $name ]  = $value;
				$this->autoload[ $name ] = $autoload;

				return true;
			}
		);

		Functions\when( 'wp_parse_args' )->alias(
			function ( $args, $defaults = array() ) {
				if ( is_object( $args ) ) {
					$args = get_object_vars( $args );
				} elseif ( ! is_array( $args ) ) {
					$args = array();
				}

				return array_merge( $defaults, $args );
			}
		);

		Functions\when( 'wp_get_theme' )->alias(
			function () {
				return new class( $this->theme_name ) {
					/**
					 * The theme name.
					 *
					 * @var string
					 */
					private $name;

					/**
					 * Constructor.
					 *
					 * @param string $name The theme name.
					 */
					public function __construct( $name ) {
						$this->name = $name;
					}

					/**
					 * Read a theme header.
					 *
					 * @param string $header The header to read.
					 * @return string|null
					 */
					public function get( $header ) {
						return 'Name' === $header ? $this->name : null;
					}
				};
			}
		);

		// Boost_API caches its client in a private static, so the first test to reach the API
		// would otherwise pin a real client for the rest of the process.
		$this->set_api_client( $this->build_api_client() );
	}

	/**
	 * Put the Boost API client back the way it was found.
	 */
	protected function tear_down() {
		$this->set_api_client( null );

		parent::tear_down();
	}

	/**
	 * Replace the client Boost_API caches.
	 *
	 * @param Boost_API_Client|null $client The client to use, or null to clear it.
	 */
	private function set_api_client( $client ) {
		$property = new \ReflectionProperty( Boost_API::class, 'api_client' );

		// Required to reach the private property before PHP 8.1, a deprecated no-op from 8.5.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}

		$property->setValue( null, $client );
	}

	/**
	 * Build a client that answers every GET with $this->api_response.
	 *
	 * @return Boost_API_Client
	 */
	private function build_api_client() {
		$test = $this;

		return new class( $test ) implements Boost_API_Client {
			/**
			 * The test case holding the canned response.
			 *
			 * @var Speed_Score_Request_Test
			 */
			private $test;

			/**
			 * Constructor.
			 *
			 * @param Speed_Score_Request_Test $test The test case holding the canned response.
			 */
			public function __construct( $test ) {
				$this->test = $test;
			}

			/**
			 * Answer a GET with the canned response.
			 *
			 * @param string  $path  Request path.
			 * @param mixed[] $query Query parameters.
			 * @param mixed[] $args  Request arguments.
			 * @return mixed
			 */
			public function get( $path, $query = array(), $args = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature is fixed by Boost_API_Client.
				return $this->test->api_response;
			}

			/**
			 * Answer a POST with an empty success.
			 *
			 * @param string  $path    Request path.
			 * @param mixed[] $payload Request payload.
			 * @param mixed[] $args    Request arguments.
			 * @return mixed
			 */
			public function post( $path, $payload = array(), $args = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature is fixed by Boost_API_Client.
				return array();
			}
		};
	}

	/**
	 * The option name the history for self::URL is stored under.
	 *
	 * @return string
	 */
	private function history_option_name() {
		return Speed_Score_History::OPTION_PREFIX . Speed_Score_Request::generate_cache_id_from_url( self::URL );
	}

	/**
	 * Seed the stored history for self::URL.
	 *
	 * @param array $entries History entries, oldest first.
	 */
	private function seed_history( array $entries ) {
		$this->options[ $this->history_option_name() ] = $entries;
	}

	/**
	 * Build a history entry.
	 *
	 * @param array  $scores    Mobile and desktop scores.
	 * @param int    $timestamp When the entry was recorded.
	 * @param string $theme     The theme active at the time.
	 * @return array
	 */
	private function entry( array $scores, $timestamp, $theme = 'Twenty Twenty-Four' ) {
		return array(
			'timestamp' => $timestamp,
			'scores'    => $scores,
			'theme'     => $theme,
		);
	}

	/**
	 * Poll a request for self::URL, with the API returning a successful run.
	 *
	 * @param array $scores The scores the run came back with.
	 */
	private function poll_with_scores( array $scores ) {
		$this->api_response = array(
			'status' => 'success',
			'scores' => $scores,
		);

		$request = new Speed_Score_Request( self::URL );
		$this->assertTrue( $request->poll_update() );
	}

	/**
	 * Read a history entry, failing the test rather than the assertion if it is missing.
	 *
	 * @param Speed_Score_History $history The history to read from.
	 * @param int                 $offset  How far back from the latest entry to look.
	 * @return array
	 */
	private function entry_at( Speed_Score_History $history, $offset = 0 ) {
		$entry = $history->latest( $offset );
		$this->assertIsArray( $entry );

		return $entry;
	}

	/**
	 * Read the history back the way the rest of the plugin does.
	 *
	 * @return Speed_Score_History
	 */
	private function stored_history() {
		return new Speed_Score_History( self::URL );
	}

	/**
	 * A run that comes back with the same scores updates the latest entry's timestamp rather
	 * than throwing the completion event away.
	 */
	public function test_unchanged_scores_touch_the_latest_entry_in_place() {
		$scores          = array(
			'mobile'  => 50,
			'desktop' => 70,
		);
		$older_scores    = array(
			'mobile'  => 40,
			'desktop' => 60,
		);
		$older_timestamp = time() - 4 * DAY_IN_SECONDS;

		$this->seed_history(
			array(
				$this->entry( $older_scores, $older_timestamp ),
				$this->entry( $scores, time() - 3 * DAY_IN_SECONDS ),
			)
		);

		$before = time();
		$this->poll_with_scores( $scores );

		$history = $this->stored_history();

		$this->assertSame( 2, $history->count(), 'No entry should have been added.' );
		$this->assertSame( $scores, $history->latest_scores(), 'The scores should not have changed.' );
		$this->assertGreaterThanOrEqual( $before, $this->entry_at( $history )['timestamp'] );

		// The entry below the latest one is what feeds previousScores and the card's score
		// increase arrow, so it has to be left alone.
		$this->assertSame( $older_scores, $history->latest_scores( 1 ) );
		$this->assertSame( $older_timestamp, $this->entry_at( $history, 1 )['timestamp'] );
	}

	/**
	 * Touching the latest entry must not drag the history option into the autoload set.
	 */
	public function test_touching_the_latest_entry_does_not_autoload_the_option() {
		$scores = array(
			'mobile'  => 50,
			'desktop' => 70,
		);

		$this->seed_history( array( $this->entry( $scores, time() - DAY_IN_SECONDS ) ) );

		$this->poll_with_scores( $scores );

		$this->assertFalse( $this->autoload[ $this->history_option_name() ] );
	}

	/**
	 * The timestamp move is what unfreezes is_stale(), so check the reader and not just the
	 * stored value.
	 */
	public function test_unchanged_scores_leave_the_history_fresh() {
		$scores = array(
			'mobile'  => 50,
			'desktop' => 70,
		);

		$this->seed_history( array( $this->entry( $scores, time() - 3 * DAY_IN_SECONDS ) ) );

		$this->assertTrue( $this->stored_history()->is_stale(), 'The seeded history should start stale.' );

		$this->poll_with_scores( $scores );

		$this->assertFalse( $this->stored_history()->is_stale() );
	}

	/**
	 * A run that comes back with different scores still pushes a new entry.
	 */
	public function test_changed_scores_push_a_new_entry() {
		$old_timestamp = time() - 3 * DAY_IN_SECONDS;
		$old_scores    = array(
			'mobile'  => 50,
			'desktop' => 70,
		);
		$new_scores    = array(
			'mobile'  => 55,
			'desktop' => 70,
		);

		$this->seed_history( array( $this->entry( $old_scores, $old_timestamp ) ) );

		$this->poll_with_scores( $new_scores );

		$history = $this->stored_history();

		$this->assertSame( 2, $history->count() );
		$this->assertSame( $new_scores, $history->latest_scores() );
		$this->assertSame( $old_scores, $history->latest_scores( 1 ) );
		$this->assertSame( $old_timestamp, $this->entry_at( $history, 1 )['timestamp'] );
	}

	/**
	 * A theme switch still pushes a new entry even when the scores repeat.
	 */
	public function test_a_theme_change_pushes_a_new_entry() {
		$scores = array(
			'mobile'  => 50,
			'desktop' => 70,
		);

		$this->seed_history( array( $this->entry( $scores, time() - 3 * DAY_IN_SECONDS, 'Twenty Twenty-Three' ) ) );

		$this->poll_with_scores( $scores );

		$history = $this->stored_history();

		$this->assertSame( 2, $history->count() );
		$this->assertSame( 'Twenty Twenty-Four', $this->entry_at( $history )['theme'] );
	}

	/**
	 * A site with no history at all records its first entry, exactly as before.
	 */
	public function test_an_empty_history_records_the_first_run() {
		$scores = array(
			'mobile'  => 50,
			'desktop' => 70,
		);

		$this->poll_with_scores( $scores );

		$history = $this->stored_history();

		$this->assertSame( 1, $history->count() );
		$this->assertSame( $scores, $history->latest_scores() );
	}

	/**
	 * Boost_Abilities defends against history entries whose scores are stdClass rather than an
	 * array, so such entries may exist on long lived sites. An object can never compare equal to
	 * the array the API returns today, which would leave the run permanently pushing and never
	 * touching. Check that it converges instead: one push to replace the legacy entry, and
	 * touches from then on.
	 */
	public function test_legacy_object_scores_converge_on_touching() {
		$scores = array(
			'mobile'  => 50,
			'desktop' => 70,
		);

		$this->seed_history(
			array(
				array(
					'timestamp' => time() - 3 * DAY_IN_SECONDS,
					'scores'    => (object) $scores,
					'theme'     => 'Twenty Twenty-Four',
				),
			)
		);

		// The stored object cannot match the array from the API, so this run pushes.
		$this->poll_with_scores( $scores );
		$this->assertSame( 2, $this->stored_history()->count() );

		// Age the entry that push just wrote. Without this the push alone leaves the history
		// fresh, and the assertion below would pass whether or not the touch happened.
		$entries = $this->options[ $this->history_option_name() ];

		$entries[ count( $entries ) - 1 ]['timestamp'] = time() - 3 * DAY_IN_SECONDS;
		$this->seed_history( $entries );
		$this->assertTrue( $this->stored_history()->is_stale() );

		// The latest entry is a plain array now, so this run touches it rather than pushing.
		$this->poll_with_scores( $scores );

		$history = $this->stored_history();
		$this->assertSame( 2, $history->count() );
		$this->assertFalse( $history->is_stale() );
	}

	/**
	 * Entries saved before the theme was recorded have no theme key. Reading one used to raise
	 * an undefined array key warning, which this suite fails on. The run should treat the theme
	 * as changed and push, quietly.
	 */
	public function test_a_legacy_entry_without_a_theme_pushes_quietly() {
		$scores = array(
			'mobile'  => 50,
			'desktop' => 70,
		);

		$this->seed_history(
			array(
				array(
					'timestamp' => time() - 3 * DAY_IN_SECONDS,
					'scores'    => $scores,
				),
			)
		);

		$this->poll_with_scores( $scores );

		$history = $this->stored_history();

		$this->assertSame( 2, $history->count() );
		$this->assertSame( 'Twenty Twenty-Four', $this->entry_at( $history )['theme'] );
	}

	/**
	 * A stale marker raised after the run was dispatched must survive the run completing with
	 * unchanged scores, because those scores predate the site change that raised the marker.
	 */
	public function test_a_stale_marker_raised_mid_run_is_not_overwritten() {
		$scores = array(
			'mobile'  => 50,
			'desktop' => 70,
		);

		$this->seed_history( array( $this->entry( $scores, time() - 3 * DAY_IN_SECONDS ) ) );

		// The run was dispatched five minutes ago; the site changed one minute ago.
		$this->options[ Transient::key( Speed_Score_History::STALE_TRANSIENT_KEY ) ] = array(
			'expire' => time() + DAY_IN_SECONDS,
			'data'   => time() - 60,
		);

		$this->api_response = array(
			'status' => 'success',
			'scores' => $scores,
		);

		$request = new Speed_Score_Request( self::URL, array(), time() - 300 );
		$this->assertTrue( $request->poll_update() );

		$history = $this->stored_history();

		$this->assertSame( 1, $history->count(), 'No entry should have been added.' );
		$this->assertTrue( $history->is_stale(), 'Scores measured before the site change must stay stale.' );
	}

	/**
	 * An empty history has nothing to touch, so touch_latest() writes nothing at all.
	 */
	public function test_touching_an_empty_history_writes_nothing() {
		$history = $this->stored_history();

		$history->touch_latest();

		$this->assertSame( 0, $history->count() );
		$this->assertArrayNotHasKey( $this->history_option_name(), $this->options );
	}
}
