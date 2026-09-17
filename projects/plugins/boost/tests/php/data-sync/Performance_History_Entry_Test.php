<?php

namespace Automattic\Jetpack_Boost\Tests\Data_Sync;

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Graph_History_Request;
use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Data_Sync\Performance_History_Entry;
use Brain\Monkey;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use Mockery;
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

	private function older_history_entry() {
		$windows = array();
		for ( $offset = 0; $offset < 6; ++$offset ) {
			$windows[] = array(
				'startDate' => 6000 - $offset * 1000,
				'endDate'   => 6999 - $offset * 1000,
			);
		}
		$entry = new Performance_History_Entry();
		$entry->set(
			array(
				'startDate'     => 1000,
				'endDate'       => 6999,
				'olderWindows'  => $windows,
				'surfaceErrors' => true,
			)
		);
		return $entry;
	}

	public function test_older_windows_preserve_independent_requests_and_cache_empty_history() {
		$cache = false;
		Functions\when( 'get_transient' )->alias(
			function () use ( &$cache ) {
				return $cache;
			}
		);
		Functions\expect( 'set_transient' )->once()->with( Mockery::type( 'string' ), Mockery::type( 'array' ), 43200 )->andReturnUsing(
			function ( $key, $value ) use ( &$cache ) {
				$cache = $value;
				return true;
			}
		);
		Functions\when( 'is_wp_error' )->justReturn( false );
		$ranges  = array();
		$request = Mockery::mock( 'overload:' . Speed_Score_Graph_History_Request::class );
		$request->shouldReceive( '__construct' )->andReturnUsing(
			function ( $start, $end ) use ( &$ranges ) {
				$ranges[] = array( $start, $end );
			}
		);
		$request->shouldReceive( 'execute' )->andReturn( array( 'data' => array() ) );
		$this->assertSame( array(), $this->older_history_entry()->get()['periods'] );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Repeat the lookup to verify cached history avoids upstream requests.
		$this->assertSame( array(), $this->older_history_entry()->get()['periods'] );
		$this->assertSame(
			array( array( 6000, 6999 ), array( 5000, 5999 ), array( 4000, 4999 ), array( 3000, 3999 ), array( 2000, 2999 ), array( 1000, 1999 ) ),
			$ranges
		);
	}

	public function test_older_windows_find_oldest_score_without_a_combined_upstream_range() {
		Functions\when( 'get_transient' )->justReturn( false );
		Functions\expect( 'set_transient' )->once();
		Functions\when( 'is_wp_error' )->justReturn( false );
		$start   = null;
		$period  = array(
			'timestamp'  => 1500,
			'dimensions' => array(
				'mobile_overall_score'  => 80,
				'desktop_overall_score' => 90,
			),
		);
		$request = Mockery::mock( 'overload:' . Speed_Score_Graph_History_Request::class );
		$request->shouldReceive( '__construct' )->andReturnUsing(
			function ( $from, $to ) use ( &$start ) {
				$start = 1999 === $to ? $from : null;
			}
		);
		$request->shouldReceive( 'execute' )->andReturnUsing(
			function () use ( &$start, $period ) {
				return array( 'data' => array( 'periods' => 1000 === $start ? array( $period ) : array() ) );
			}
		);
		$this->assertSame( array( $period ), $this->older_history_entry()->get()['periods'] );
	}

	public function test_older_window_errors_are_not_cached_as_empty_history() {
		Functions\when( 'get_transient' )->justReturn( false );
		Functions\expect( 'set_transient' )->never();
		$error = $this->upstream_error();
		Functions\when( 'is_wp_error' )->justReturn( true );
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->andReturn( true );
		$request = Mockery::mock( 'overload:' . Speed_Score_Graph_History_Request::class );
		$request->shouldReceive( 'execute' )->once()->andReturn( $error );
		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'History service unavailable' );
		$this->older_history_entry()->get();
	}

	public function test_malformed_older_history_is_not_cached() {
		Functions\when( 'get_transient' )->justReturn( false );
		Functions\expect( 'set_transient' )->never();
		Functions\when( 'is_wp_error' )->justReturn( false );
		$request = Mockery::mock( 'overload:' . Speed_Score_Graph_History_Request::class );
		$request->shouldReceive( 'execute' )->once()->andReturn( array( 'unexpected' => array() ) );
		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'Invalid performance history response.' );
		$this->older_history_entry()->get();
	}
}
