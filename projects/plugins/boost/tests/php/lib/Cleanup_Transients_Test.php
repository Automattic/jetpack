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
			public $options          = 'wp_options';
			public $last_error       = '';
			public $fail_batch       = false;
			public $fail_next_reread = false;
			public $after_batch;
			public $single_reads = array();
			private $rows;

			public function __construct( &$rows ) {
				$this->rows = &$rows;
			}

			public function esc_like( $text ) {
				return addcslashes( $text, '_%\\' );
			}

			public function prepare( $sql, ...$args ) {
				if ( 1 === count( $args ) ) {
					return $args[0];
				}
				Assert::assertStringContainsString( 'option_id > %d', $sql );
				Assert::assertStringContainsString( 'ORDER BY option_id ASC LIMIT %d', $sql );
				Assert::assertSame( 'jb\\_transient\\_%', $args[0] );
				return array( $args[1], $args[2] );
			}

			public function get_results( $query ) {
				$this->last_error = $this->fail_batch ? 'Query failed' : '';
				if ( $this->fail_batch ) {
					return array();
				}
				$rows = array_slice(
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
				if ( $this->after_batch ) {
					call_user_func( $this->after_batch );
				}
				return $rows;
			}

			public function get_var( $id ) {
				$this->single_reads[] = $id;
				$this->last_error     = $this->fail_next_reread ? 'Query failed' : '';
				if ( $this->fail_next_reread ) {
					$this->fail_next_reread = false;
					return null;
				}
				foreach ( $this->rows as $row ) {
					if ( $row['option_id'] === $id ) {
						return $row['option_value'];
					}
				}
				return null;
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
		Functions\when( 'maybe_unserialize' )->alias(
			static function ( $value ) {
				return is_string( $value ) ? unserialize( $value ) : $value; // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize
			}
		);
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
		$this->seed_row( 5, (object) array( 'expire' => 1 ) );

		Cleanup_Transients::run_cleanup();

		$this->assertSame( array( 'jb_transient_test_2', 'jb_transient_test_3', 'jb_transient_test_4', 'jb_transient_test_5' ), array_keys( $this->rows ) );
		$this->assertSame( array( 'jetpack_boost_general_cleanup_last_processed_option_id' ), $this->option_reads );
		$this->assertSame( 0, $this->cursor );
		$this->assertSame( 0, $this->schedules );
	}

	public function test_followup_resumes_after_invalid_row_and_finishes_the_pass() {
		for ( $i = 1; $i <= 1001; ++$i ) {
			$this->seed_row( $i, 1000 === $i ? array( 'data' => 'no expiry' ) : array( 'expire' => 1 ) );
		}

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

	public function test_keeps_a_row_refreshed_after_the_batch_read() {
		$this->seed_row( 1, array( 'expire' => 1 ) );
		$this->seed_row( 2, array( 'expire' => 1 ) );
		$this->seed_row( 3, array( 'expire' => PHP_INT_MAX ) );
		global $wpdb;
		$wpdb->after_batch = function () {
			$this->seed_row( 2, array( 'expire' => PHP_INT_MAX ) );
		};

		Cleanup_Transients::run_cleanup();

		$this->assertSame( array( 'jb_transient_test_2', 'jb_transient_test_3' ), array_keys( $this->rows ) );
		$this->assertSame( array( 1, 2 ), $wpdb->single_reads );
	}

	public function test_requires_a_numeric_expiry() {
		foreach ( array( false, '', 'abc', '1', 1.5 ) as $id => $expiry ) {
			$this->seed_row( $id + 1, array( 'expire' => $expiry ) );
		}

		Cleanup_Transients::run_cleanup();

		$this->assertSame( array( 'jb_transient_test_1', 'jb_transient_test_2', 'jb_transient_test_3' ), array_keys( $this->rows ) );
	}

	public function test_preserves_the_cursor_when_the_batch_query_fails() {
		$this->cursor = 42;
		global $wpdb;
		$wpdb->fail_batch = true;

		Cleanup_Transients::run_cleanup();

		$this->assertSame( 42, $this->cursor );
		$this->assertSame( 0, $this->schedules );
	}

	public function test_stops_on_a_failed_reread() {
		$this->cursor = 42;
		$this->seed_row( 43, array( 'expire' => 1 ) );
		$this->seed_row( 44, array( 'expire' => 1 ) );
		global $wpdb;
		$wpdb->fail_next_reread = true;

		Cleanup_Transients::run_cleanup();

		$this->assertSame( array( 'jb_transient_test_43', 'jb_transient_test_44' ), array_keys( $this->rows ) );
		$this->assertSame( 42, $this->cursor );
		$this->assertSame( 0, $this->schedules );
		$this->assertSame( array( 43 ), $wpdb->single_reads );
	}
}
