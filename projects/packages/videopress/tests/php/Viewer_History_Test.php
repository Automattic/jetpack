<?php
/**
 * Tests for viewer history rules.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- The in-memory store ignores some interface arguments.

use Automattic\Jetpack\VideoPress\History_Store;
use Automattic\Jetpack\VideoPress\Viewer_History;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Test suite for Viewer_History.
 */
class Viewer_History_Test extends BaseTestCase {

	/**
	 * Rows keyed by "user:guid".
	 *
	 * @var array<string, array>
	 */
	public $rows = array();

	/**
	 * Use an in-memory store.
	 */
	protected function set_up() {
		$test = $this;
		Viewer_History::reset();
		add_filter(
			'videopress_history_store',
			function () use ( $test ) {
				return new class( $test ) implements History_Store {
					/**
					 * Owning test.
					 *
					 * @var Viewer_History_Test
					 */
					private $test;

					/**
					 * Constructor.
					 *
					 * @param Viewer_History_Test $test Owning test.
					 */
					public function __construct( $test ) {
						$this->test = $test;
					}

					/**
					 * {@inheritDoc}
					 *
					 * @param int    $user_id Viewer.
					 * @param string $guid    GUID.
					 */
					public function get( $user_id, $guid ) {
						return $this->test->rows[ "$user_id:$guid" ] ?? null;
					}

					/**
					 * {@inheritDoc}
					 *
					 * @param int      $user_id Viewer.
					 * @param string[] $guids   GUIDs.
					 */
					public function get_many( $user_id, array $guids ) {
						return array();
					}

					/**
					 * {@inheritDoc}
					 *
					 * @param array $row Row.
					 */
					public function save( array $row ) {
						$this->test->rows[ $row['user_id'] . ':' . $row['guid'] ] = $row;
						return true;
					}

					/**
					 * {@inheritDoc}
					 *
					 * @param int        $user_id Viewer.
					 * @param int        $limit   Limit.
					 * @param array|null $after   Cursor.
					 */
					public function list_recent( $user_id, $limit, $after = null ) {
						return array_values(
							array_filter(
								$this->test->rows,
								function ( $row ) use ( $user_id ) {
									return $row['user_id'] === $user_id && ! $row['deleted'];
								}
							)
						);
					}

					/**
					 * {@inheritDoc}
					 *
					 * @param int $user_id Viewer.
					 */
					public function delete_all( $user_id ) {
						foreach ( array_keys( $this->test->rows ) as $key ) {
							if ( 0 === strpos( $key, "$user_id:" ) ) {
								unset( $this->test->rows[ $key ] );
							}
						}
						return 1;
					}

					/**
					 * {@inheritDoc}
					 *
					 * @param int $before           Time.
					 * @param int $tombstone_before Time.
					 */
					public function purge( $before, $tombstone_before ) {
						return 0;
					}
				};
			}
		);
	}

	/**
	 * Remove the store.
	 */
	protected function tear_down() {
		remove_all_filters( 'videopress_history_store' );
		Viewer_History::reset();
	}

	/**
	 * A progress event.
	 *
	 * @param array $segments   Played segments.
	 * @param int   $seq        Sequence.
	 * @param int   $generation Generation.
	 * @param int   $epoch      Epoch.
	 * @return array
	 */
	private function progress( array $segments, $seq = 1, $generation = 0, $epoch = 0 ) {
		return array(
			'action'      => 'progress',
			'epoch'       => $epoch,
			'generation'  => $generation,
			'session'     => 'tab-1',
			'seq'         => $seq,
			'position_ms' => end( $segments )[1] ?? 0,
			'duration_ms' => 100000,
			'segments'    => $segments,
		);
	}

	public function test_seeking_to_the_end_is_not_completion() {
		$row = Viewer_History::apply( 1, 'abcd1234', $this->progress( array( array( 0, 5000 ), array( 95000, 100000 ) ) ) );

		$this->assertFalse( $row['completed'] );
		$this->assertSame( 'in_progress', Viewer_History::status( $row ) );
	}

	public function test_ninety_percent_of_merged_intervals_completes() {
		Viewer_History::apply( 1, 'abcd1234', $this->progress( array( array( 0, 50000 ) ), 1 ) );
		$row = Viewer_History::apply( 1, 'abcd1234', $this->progress( array( array( 40000, 90000 ) ), 2 ) );

		$this->assertSame( array( array( 0, 90000 ) ), $row['intervals'] );
		$this->assertTrue( $row['completed'] );
		$this->assertSame( 'watched', Viewer_History::status( $row ) );
	}

	public function test_duplicate_events_are_idempotent() {
		$first = Viewer_History::apply( 1, 'abcd1234', $this->progress( array( array( 0, 10000 ) ), 3 ) );
		$again = Viewer_History::apply( 1, 'abcd1234', $this->progress( array( array( 50000, 60000 ) ), 3 ) );

		$this->assertSame( $first['intervals'], $again['intervals'] );
	}

	public function test_unwatched_rejects_delayed_events_from_before_the_reset() {
		Viewer_History::apply( 1, 'abcd1234', $this->progress( array( array( 0, 50000 ) ) ) );
		$reset = Viewer_History::apply(
			1,
			'abcd1234',
			array(
				'action' => 'unwatched',
				'epoch'  => 0,
			)
		);
		$late  = Viewer_History::apply( 1, 'abcd1234', $this->progress( array( array( 0, 100000 ) ), 9, 0 ) );

		$this->assertSame( 1, $reset['generation'] );
		$this->assertInstanceOf( WP_Error::class, $late );
		$this->assertSame( 409, $late->get_error_data()['status'] );
		$this->assertSame( 'none', Viewer_History::status( $this->rows['1:abcd1234'] ) );
	}

	public function test_clearing_history_rejects_events_from_the_old_epoch_and_viewers_stay_isolated() {
		Viewer_History::apply( 1, 'abcd1234', $this->progress( array( array( 0, 95000 ) ) ) );
		Viewer_History::apply( 2, 'abcd1234', $this->progress( array( array( 0, 10000 ) ) ) );
		$user = wp_insert_user(
			array(
				'user_login' => 'viewer-a',
				'user_pass'  => 'pass',
			)
		);
		Viewer_History::apply( $user, 'abcd1234', $this->progress( array( array( 0, 10000 ) ) ) );

		$epoch = Viewer_History::clear( $user );

		$this->assertSame( 1, $epoch );
		$this->assertArrayNotHasKey( "$user:abcd1234", $this->rows );
		$this->assertInstanceOf( WP_Error::class, Viewer_History::apply( $user, 'abcd1234', $this->progress( array( array( 0, 10000 ) ), 2 ) ) );
		$this->assertSame( 'watched', Viewer_History::status( $this->rows['1:abcd1234'] ) );
		$this->assertSame( 'in_progress', Viewer_History::status( $this->rows['2:abcd1234'] ) );
	}

	public function test_manual_watched_and_legacy_seen_stay_distinct() {
		$row = Viewer_History::apply(
			1,
			'abcd1234',
			array(
				'action' => 'watched',
				'epoch'  => 0,
			)
		);
		$this->assertSame( 'watched', Viewer_History::status( $row ) );
		$this->assertFalse( $row['completed'], 'A manual mark is not an automatic completion.' );

		$legacy                = $row;
		$legacy['manual']      = '';
		$legacy['legacy_seen'] = true;
		$this->assertSame( 'legacy_seen', Viewer_History::status( $legacy ) );
	}

	public function test_hide_watched_drops_watched_videos_before_paging() {
		$user = wp_insert_user(
			array(
				'user_login' => 'viewer-h',
				'user_pass'  => 'pass',
			)
		);
		wp_set_current_user( $user );
		Viewer_History::apply( $user, 'video001', $this->progress( array( array( 0, 95000 ) ) ) );
		Viewer_History::apply( $user, 'video002', $this->progress( array( array( 0, 5000 ) ) ) );
		add_filter(
			'videopress_channel_videos',
			function () {
				return array_map(
					function ( $n ) {
						return array(
							'id'          => $n,
							'guid'        => 'video00' . $n,
							'durationMs'  => 100000,
							'height'      => 720,
							'publishedAt' => 10 - $n,
						);
					},
					array( 1, 2, 3 )
				);
			}
		);

		$this->assertSame( array( 'video001' ), Viewer_History::watched_guids( $user ) );
		$result = \Automattic\Jetpack\VideoPress\Channel_Data::browse(
			array(
				'search' => '',
				'sort'   => 'newest',
				'length' => 'any',
				'page'   => 1,
				'terms'  => array(),
				'hide'   => 'watched',
			),
			1
		);
		remove_all_filters( 'videopress_channel_videos' );
		wp_set_current_user( 0 );

		$this->assertSame( 2, $result['total'] );
		$this->assertSame( array( 'video002' ), array_column( $result['entries'], 'guid' ) );
	}
}
