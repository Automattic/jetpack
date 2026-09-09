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

	private function history_entry( $result, $is_error ) {
		$request = Mockery::mock( 'overload:' . Speed_Score_Graph_History_Request::class );
		$request->shouldReceive( 'execute' )->once()->andReturn( $result );
		Functions\when( 'is_wp_error' )->justReturn( $is_error );
		$entry = new Performance_History_Entry();
		$entry->set(
			array(
				'startDate' => 1000,
				'endDate'   => 2000,
			)
		);
		return $entry;
	}

	private function upstream_error() {
		$error = Mockery::mock( 'WP_Error' );
		$error->shouldReceive( 'get_error_message' )->andReturn( 'History service unavailable' );
		return $error;
	}

	public function test_modern_history_surfaces_upstream_error() {
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->with( false )->andReturn( true );
		$entry = $this->history_entry( $this->upstream_error(), true );
		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'History service unavailable' );
		$entry->get();
	}

	public function test_legacy_history_preserves_empty_error_fallback() {
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->with( false )->andReturn( false );
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

	public function test_modern_empty_history_remains_successful() {
		Filters\expectApplied( Admin::MODERNIZATION_FILTER )->andReturn( true );
		$this->assertSame(
			array(
				'startDate'   => 1000,
				'endDate'     => 2000,
				'periods'     => array(),
				'annotations' => array(),
			),
			$this->history_entry( array( 'data' => array() ), false )->get()
		);
	}
}
