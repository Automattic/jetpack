<?php

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Cleanup_Transients;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Assert;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack_Boost\Lib\Cleanup_Transients
 */
#[CoversClass( Cleanup_Transients::class )]
class Cleanup_Transients_Test extends Base_TestCase {

	private $original_wpdb;
	private $rows         = array();
	private $cursor       = 0;
	private $scheduled    = false;
	private $schedules    = 0;
	private $option_reads = array();

	protected function set_up() {
		parent::set_up();
		if ( ! defined( 'ARRAY_A' ) ) {
			define( 'ARRAY_A', 'ARRAY_A' );
		}

		global $wpdb;
		$this->original_wpdb = $wpdb;
		$wpdb                = new class( $this->rows ) {
			public $options = 'wp_options';
			private $rows;

			public function __construct( &$rows ) {
				$this->rows = &$rows;
			}

			public function esc_like( $text ) {
				return addcslashes( $text, '_%\\' );
			}

			public function prepare( $sql, $pattern, $cursor, $limit ) {
				Assert::assertStringContainsString( 'ORDER BY option_id ASC LIMIT %d', $sql );
				Assert::assertSame( 'jb\\_transient\\_%', $pattern );
				return array( $cursor, $limit );
			}

			public function get_results( $query ) {
				return array_slice(
					array_values(
						array_filter(
							$this->rows,
							static function ( $row ) use ( $query ) {
								return $row['option_id'] > $query[0];
							}
						)
					),
					0,
					$query[1]
				);
			}
		};

		Functions\when( 'get_option' )->alias(
			function ( $name ) {
				$this->option_reads[] = $name;
				return $this->cursor;
			}
		);
		Functions\when( 'update_option' )->alias(
			function ( $name, $value, $autoload ) {
				$this->assertSame( 'jetpack_boost_general_cleanup_last_processed_option_id', $name );
				$this->assertFalse( $autoload );
				$this->cursor = $value;
			}
		);
		Functions\when( 'delete_option' )->alias(
			function ( $name ) {
				if ( 'jetpack_boost_general_cleanup_last_processed_option_id' === $name ) {
					$this->cursor = 0;
				} else {
					unset( $this->rows[ $name ] );
				}
			}
		);
		Functions\when( 'maybe_unserialize' )->alias( 'unserialize' );
		Functions\when( 'wp_next_scheduled' )->alias(
			function () {
				return $this->scheduled;
			}
		);
		Functions\when( 'wp_schedule_single_event' )->alias(
			function ( $timestamp, $hook ) {
				$this->assertSame( Cleanup_Transients::FOLLOWUP_HOOK, $hook );
				$this->assertIsInt( $timestamp );
				++$this->schedules;
			}
		);
	}

	protected function tear_down() {
		$GLOBALS['wpdb'] = $this->original_wpdb;
		parent::tear_down();
	}

	private function seed_row( $id, $value ) {
		$name                = 'jb_transient_test_' . $id;
		$this->rows[ $name ] = array(
			'option_id'    => $id,
			'option_name'  => $name,
			'option_value' => serialize( $value ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
		);
	}

	public function test_deletes_only_expired_rows() {
		$this->seed_row(
			1,
			array(
				'expire' => 1,
				'data'   => 'expired',
			)
		);
		$this->seed_row(
			2,
			array(
				'expire' => PHP_INT_MAX,
				'data'   => 'live',
			)
		);
		$this->seed_row( 3, 'invalid' );
		$this->seed_row( 4, array( 'data' => 'no expiry' ) );

		Cleanup_Transients::run_cleanup();

		$this->assertSame( array( 'jb_transient_test_2', 'jb_transient_test_3', 'jb_transient_test_4' ), array_keys( $this->rows ) );
		$this->assertSame( array( 'jetpack_boost_general_cleanup_last_processed_option_id' ), $this->option_reads );
		$this->assertSame( 0, $this->cursor );
		$this->assertSame( 0, $this->schedules );
	}

	public function test_followup_resumes_after_invalid_row_and_finishes_the_pass() {
		for ( $i = 1; $i <= 1001; ++$i ) {
			$this->seed_row(
				$i,
				array(
					'expire' => 1,
					'data'   => 'expired',
				)
			);
		}
		$this->seed_row( 1000, array( 'data' => 'no expiry' ) );

		Cleanup_Transients::run_cleanup();
		$this->assertSame( 1000, $this->cursor );
		$this->assertCount( 2, $this->rows );
		$this->assertSame( 1, $this->schedules );

		Cleanup_Transients::run_cleanup();
		$this->assertSame( array( 'jb_transient_test_1000' ), array_keys( $this->rows ) );
		$this->assertSame( 0, $this->cursor );
		$this->assertSame( 1, $this->schedules );
	}

	public function test_does_not_duplicate_a_pending_followup() {
		for ( $i = 1; $i <= 1001; ++$i ) {
			$this->seed_row( $i, array( 'expire' => PHP_INT_MAX ) );
		}
		$this->scheduled = time();

		Cleanup_Transients::run_cleanup();

		$this->assertCount( 1001, $this->rows );
		$this->assertSame( 1000, $this->cursor );
		$this->assertSame( 0, $this->schedules );
	}
}
