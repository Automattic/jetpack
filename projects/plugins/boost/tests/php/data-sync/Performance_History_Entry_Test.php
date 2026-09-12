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

	public function test_filter_off_preserves_empty_error_fallback_with_opt_in() {
		Functions\when( 'is_admin' )->justReturn( true );
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

	public function test_modern_rest_history_surfaces_upstream_error_with_opt_in() {
		define( 'REST_REQUEST', true );
		Functions\when( 'is_admin' )->justReturn( false );
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->with( false )->andReturn( true );
		$entry = $this->history_entry( $this->upstream_error(), true, true );
		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'History service unavailable' );
		$entry->get();
	}

	public function test_cli_history_preserves_empty_error_fallback_without_opt_in() {
		define( 'WP_CLI', true );
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->with( false )->andReturn( true );
		Functions\when( 'is_admin' )->justReturn( false );
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

	public function test_legacy_rest_history_preserves_empty_error_fallback_without_opt_in() {
		define( 'REST_REQUEST', true );
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->with( false )->andReturn( true );
		Functions\when( 'is_admin' )->justReturn( false );
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

	public function test_modern_empty_history_remains_successful() {
		Functions\when( 'is_admin' )->justReturn( true );
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
}
