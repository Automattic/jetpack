<?php

namespace Automattic\Jetpack_Boost\Tests\Data_Sync;

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Graph_History_Request;
use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Data_Sync\Performance_History_Entry;
use Brain\Monkey;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Performance_History_Entry_Test extends TestCase {
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );
	}

	protected function tearDown(): void {
		Mockery::close();
		Monkey\tearDown();
		parent::tearDown();
	}

	private function history_entry( $result, $is_error, $surface_errors = null ) {
		$request = Mockery::mock( 'overload:' . Speed_Score_Graph_History_Request::class );
		$request->shouldReceive( 'execute' )->once()->andReturn( $result );
		Functions\when( 'is_wp_error' )->justReturn( $is_error );
		$entry = new Performance_History_Entry();
		$value = array(
			'startDate' => 1000,
			'endDate'   => 2000,
		);
		if ( null !== $surface_errors ) {
			$value['surfaceErrors'] = $surface_errors;
		}
		$entry->set( $value );
		return $entry;
	}

	private function upstream_error() {
		$error = Mockery::mock( 'WP_Error' );
		$error->shouldReceive( 'get_error_message' )->andReturn( 'History service unavailable' );
		return $error;
	}

	public function test_filter_off_preserves_empty_error_fallback_with_surface_errors() {
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->with( false )->andReturn( false );
		$this->assertSame(
			array(
				'startDate'   => 1000,
				'endDate'     => 2000,
				'periods'     => array(),
				'annotations' => array(),
			),
			$this->history_entry( $this->upstream_error(), true, true )->get()
		);
	}

	public function test_filter_on_surfaces_upstream_error_with_surface_errors() {
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->with( false )->andReturn( true );
		$entry = $this->history_entry( $this->upstream_error(), true, true );
		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'History service unavailable' );
		$entry->get();
	}

	public function test_filter_on_preserves_empty_error_fallback_without_surface_errors() {
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->with( false )->andReturn( true );
		$this->assertSame(
			array(
				'startDate'   => 1000,
				'endDate'     => 2000,
				'periods'     => array(),
				'annotations' => array(),
			),
			$this->history_entry( $this->upstream_error(), true )->get()
		);
	}

	public function test_filter_on_preserves_empty_error_fallback_after_surface_errors_reset() {
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->with( false )->andReturn( true );
		$entry = $this->history_entry( $this->upstream_error(), true, true );
		$entry->set(
			array(
				'startDate' => 1000,
				'endDate'   => 2000,
			)
		);
		$this->assertSame(
			array(
				'startDate'   => 1000,
				'endDate'     => 2000,
				'periods'     => array(),
				'annotations' => array(),
			),
			$entry->get()
		);
	}

	public function test_empty_history_remains_successful_with_surface_errors() {
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->andReturn( true );
		$this->assertSame(
			array(
				'startDate'   => 1000,
				'endDate'     => 2000,
				'periods'     => array(),
				'annotations' => array(),
			),
			$this->history_entry( array( 'data' => array() ), false, true )->get()
		);
	}

	private function older_history_entry( $window_count = 6 ) {
		$windows = array();
		for ( $offset = 0; $offset < $window_count; ++$offset ) {
			$windows[] = array(
				'startDate' => 6000 - $offset * 1000,
				'endDate'   => 6999 - $offset * 1000,
			);
		}
		$entry = new Performance_History_Entry();
		$entry->set(
			array(
				'startDate'         => 1000,
				'endDate'           => 6999,
				'olderWindows'      => $windows,
				'surfaceErrors'     => true,
				'checkOlderWindows' => true,
			)
		);
		return $entry;
	}

	/**
	 * Back the Boost transient helper with an in-memory option store the tests can inspect.
	 *
	 * @param array $options Option store, by reference.
	 */
	private function stub_transient_store( &$options ) {
		Functions\when( 'get_option' )->alias(
			function ( $name, $default_value = false ) use ( &$options ) {
				return array_key_exists( $name, $options ) ? $options[ $name ] : $default_value;
			}
		);
		Functions\when( 'update_option' )->alias(
			function ( $name, $value ) use ( &$options ) {
				$options[ $name ] = $value;
				return true;
			}
		);
		Functions\when( 'delete_option' )->alias(
			function ( $name ) use ( &$options ) {
				unset( $options[ $name ] );
				return true;
			}
		);
	}

	/**
	 * Record every upstream window request and answer each with the given periods.
	 *
	 * @param array $periods_by_start Periods keyed by window start.
	 * @param array $ranges           Requested ranges, by reference.
	 */
	private function stub_upstream_windows( $periods_by_start, &$ranges ) {
		Functions\when( 'is_wp_error' )->justReturn( false );
		$start   = null;
		$request = Mockery::mock( 'overload:' . Speed_Score_Graph_History_Request::class );
		$request->shouldReceive( '__construct' )->andReturnUsing(
			function ( $from, $to ) use ( &$ranges, &$start ) {
				$ranges[] = array( $from, $to );
				$start    = $from;
			}
		);
		$request->shouldReceive( 'execute' )->andReturnUsing(
			function () use ( &$start, $periods_by_start ) {
				return array( 'data' => array( 'periods' => $periods_by_start[ $start ] ?? array() ) );
			}
		);
	}

	private function scored_period( $timestamp ) {
		return array(
			'timestamp'  => $timestamp,
			'dimensions' => array(
				'mobile_overall_score'  => 80,
				'desktop_overall_score' => 90,
			),
		);
	}

	public function test_older_windows_preserve_independent_requests_and_cache_each_window() {
		$options = array();
		$ranges  = array();
		$this->stub_transient_store( $options );
		$this->stub_upstream_windows( array(), $ranges );
		$this->assertSame( array(), $this->older_history_entry()->get()['periods'] );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Repeat the lookup to verify cached windows avoid upstream requests.
		$this->assertSame( array(), $this->older_history_entry()->get()['periods'] );
		$this->assertSame(
			array( array( 6000, 6999 ), array( 5000, 5999 ), array( 4000, 4999 ), array( 3000, 3999 ), array( 2000, 2999 ), array( 1000, 1999 ) ),
			$ranges
		);
		$this->assertCount( 6, $options );
	}

	public function test_empty_and_scored_older_windows_share_one_lifetime() {
		$options = array();
		$ranges  = array();
		$this->stub_transient_store( $options );
		$this->stub_upstream_windows( array( 5000 => array( $this->scored_period( 5500 ) ) ), $ranges );
		$this->older_history_entry()->get();
		$this->assertCount( 2, $options );
		foreach ( $options as $option ) {
			$this->assertEqualsWithDelta( 43200, $option['expire'] - time(), 5 );
		}
	}

	public function test_older_windows_find_oldest_score_without_a_combined_upstream_range() {
		$options = array();
		$ranges  = array();
		$period  = $this->scored_period( 1500 );
		$this->stub_transient_store( $options );
		$this->stub_upstream_windows( array( 1000 => array( $period ) ), $ranges );
		$this->assertSame( array( $period ), $this->older_history_entry()->get()['periods'] );
		$this->assertSame( array( 1000, 1999 ), end( $ranges ) );
	}

	public function test_older_window_walk_stops_at_the_first_scored_window() {
		$options = array();
		$ranges  = array();
		$this->stub_transient_store( $options );
		$this->stub_upstream_windows( array( 6000 => array( $this->scored_period( 6500 ) ) ), $ranges );
		$this->assertCount( 1, $this->older_history_entry()->get()['periods'] );
		$this->assertSame( array( array( 6000, 6999 ) ), $ranges );
	}

	public function test_scores_outside_a_window_do_not_end_the_walk() {
		$options = array();
		$ranges  = array();
		$this->stub_transient_store( $options );
		$this->stub_upstream_windows( array( 6000 => array( $this->scored_period( 500 ) ) ), $ranges );
		$this->assertSame( array(), $this->older_history_entry()->get()['periods'] );
		$this->assertCount( 6, $ranges );
	}

	public function test_more_windows_than_supported_are_rejected_as_a_runtime_error() {
		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'At most 6 older history windows are supported.' );
		$this->older_history_entry( 7 );
	}

	/**
	 * @dataProvider provide_history_free_responses
	 * @param array $response Upstream response without any history.
	 */
	#[DataProvider( 'provide_history_free_responses' )]
	public function test_older_windows_without_history_data_are_empty_not_failures( $response ) {
		$options = array();
		$this->stub_transient_store( $options );
		Functions\when( 'is_wp_error' )->justReturn( false );
		$request = Mockery::mock( 'overload:' . Speed_Score_Graph_History_Request::class );
		$request->shouldReceive( 'execute' )->andReturn( $response );
		$this->assertSame( array(), $this->older_history_entry()->get()['periods'] );
		$this->assertCount( 6, $options );
	}

	public static function provide_history_free_responses() {
		return array(
			'absent data' => array( array() ),
			'null data'   => array( array( 'data' => null ) ),
		);
	}

	public function test_older_window_errors_are_not_cached_and_keep_finished_windows() {
		$options = array();
		$ranges  = array();
		$this->stub_transient_store( $options );
		$error = $this->upstream_error();
		Functions\when( 'is_wp_error' )->alias(
			function ( $thing ) {
				return $thing instanceof \Mockery\MockInterface;
			}
		);
		$request = Mockery::mock( 'overload:' . Speed_Score_Graph_History_Request::class );
		$request->shouldReceive( '__construct' )->andReturnUsing(
			function ( $from, $to ) use ( &$ranges ) {
				$ranges[] = array( $from, $to );
			}
		);
		$request->shouldReceive( 'execute' )->andReturnUsing(
			function () use ( &$ranges, $error ) {
				return 5000 === end( $ranges )[0] ? $error : array( 'data' => array( 'periods' => array() ) );
			}
		);
		try {
			$this->older_history_entry()->get();
			$this->fail( 'Expected the upstream error to surface.' );
		} catch ( \RuntimeException $e ) {
			$this->assertSame( 'History service unavailable', $e->getMessage() );
		}
		$this->assertCount( 1, $options );
		$ranges = array();
		try {
			$this->older_history_entry()->get();
			$this->fail( 'Expected the upstream error to surface.' );
		} catch ( \RuntimeException $e ) {
			$this->assertSame( 'History service unavailable', $e->getMessage() );
		}
		$this->assertSame( array( array( 5000, 5999 ) ), $ranges );
	}

	public function test_malformed_older_history_is_not_cached() {
		$options = array();
		$this->stub_transient_store( $options );
		Functions\when( 'is_wp_error' )->justReturn( false );
		$request = Mockery::mock( 'overload:' . Speed_Score_Graph_History_Request::class );
		$request->shouldReceive( 'execute' )->once()->andReturn( array( 'data' => 'nope' ) );
		try {
			$this->older_history_entry()->get();
			$this->fail( 'Expected the malformed response to surface.' );
		} catch ( \RuntimeException $e ) {
			$this->assertSame( 'Invalid performance history response.', $e->getMessage() );
		}
		$this->assertSame( array(), $options );
	}

	public function test_clearing_the_cache_forgets_every_older_window() {
		$options = array();
		$ranges  = array();
		$this->stub_transient_store( $options );
		$this->stub_upstream_windows( array(), $ranges );
		$this->older_history_entry()->get();
		$this->assertCount( 6, $options );

		global $wpdb;
		$original_wpdb = $wpdb;
		$wpdb          = new class( $options ) {
			public $options = 'wp_options';

			private $store;

			public function __construct( &$store ) {
				$this->store = &$store;
			}

			public function esc_like( $text ) {
				return $text;
			}

			public function prepare( $query, $pattern ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return $pattern;
			}

			public function get_col( $pattern ) {
				$prefix = rtrim( $pattern, '%' );
				return array_values(
					array_filter(
						array_keys( $this->store ),
						function ( $name ) use ( $prefix ) {
							return 0 === strpos( $name, $prefix );
						}
					)
				);
			}
		};
		try {
			Performance_History_Entry::clear_cache();
		} finally {
			$wpdb = $original_wpdb;
		}

		$this->assertSame( array(), $options );
		$ranges = array();
		$this->older_history_entry()->get();
		$this->assertCount( 6, $ranges );
	}

	public function test_a_dropped_older_windows_value_fails_instead_of_widening_the_request() {
		$entry = new Performance_History_Entry();
		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'Older history windows are missing or malformed.' );
		$entry->set(
			array(
				'startDate'         => 1000,
				'endDate'           => 6999,
				'checkOlderWindows' => true,
			)
		);
	}
}
