<?php
/**
 * Performance benchmarking utilities for Block_Scanner tests.
 *
 * This class provides utilities for competitive benchmarking between different approaches,
 * statistical analysis, system load detection, and performance assertions.
 *
 * @package Automattic\Block_Delimiter
 */

declare( strict_types=1 );

namespace Automattic\Block_Delimiter\Tests\Lib;

/**
 * Utilities for performance benchmarking and statistical analysis.
 */
class Performance_Benchmark_Utils {

	// Benchmark configuration constants
	public const PERF_WARMUP_RUNS                = 3;     // Reduced warmup runs for faster CI execution
	public const PERF_BENCHMARK_ITERATIONS       = 11;    // Fewer iterations for CI stability
	public const PERF_RETRY_BENCHMARK_ITERATIONS = 21;    // Reduced retry iterations

	// CI-friendly performance assertion thresholds (regression detection vs absolute performance)
	public const PERF_MIN_TIME_RATIO_THRESHOLD   = 1.02;  // Scanner must not be significantly slower
	public const PERF_MIN_FAVORABLE_RUNS_PERCENT = 55;    // Majority of runs should show scanner advantage
	public const PERF_MEMORY_TOLERANCE_BYTES     = 128 * 1024; // 128KB tolerance for CI memory variations

	/**
	 * Generate test content with target image positioned for early termination test.
	 *
	 * Creates 10 paragraph blocks before the image, then 100 after for CI-friendly execution while preserving early-exit advantage.
	 *
	 * @return string Block content with image at early position.
	 */
	public static function generate_test_content_with_target_image(): string {
		$blocks = array();

		// Add 10 paragraph blocks before target (reduced for CI stability)
		for ( $i = 0; $i < 10; $i++ ) {
			$blocks[] = array(
				'blockName'    => 'core/paragraph',
				'attrs'        => array(),
				'innerContent' => array( sprintf( '<p>Content %d</p>', $i + 1 ) ),
			);
		}

		// Add target image block with attributes
		$blocks[] = array(
			'blockName'    => 'core/image',
			'attrs'        => array(
				'id'     => 12345,
				'alt'    => 'Test image',
				'url'    => 'https://example.com/test.jpg',
				'width'  => 800,
				'height' => 600,
			),
			'innerContent' => array( '<figure class="wp-block-image"><img src="https://example.com/test.jpg" alt="Test image"/></figure>' ),
		);

		// Add blocks after target (100 blocks - still enough to show early-exit advantage but faster for CI)
		for ( $i = 0; $i < 100; $i++ ) {
			$blocks[] = array(
				'blockName'    => 'core/paragraph',
				'attrs'        => array(),
				'innerContent' => array( sprintf( '<p>After %d</p>', $i + 1 ) ),
			);
		}

		return \serialize_blocks( $blocks );
	}

	/**
	 * Check if system is under high load that could affect performance test reliability.
	 *
	 * @return bool True if system load is too high for reliable performance testing.
	 */
	public static function is_system_under_high_load(): bool {
		// Check available memory - skip if less than 64MB free
		$memory_limit = ini_get( 'memory_limit' );
		if ( $memory_limit && $memory_limit !== '-1' ) {
			$memory_limit_bytes = self::parse_memory_limit( $memory_limit );
			$current_usage      = \memory_get_usage( true );
			$available_memory   = $memory_limit_bytes - $current_usage;

			if ( $available_memory < 64 * 1024 * 1024 ) { // Less than 64MB available
				return true;
			}
		}

		// Basic load average check on Unix systems
		if ( \function_exists( 'sys_getloadavg' ) ) {
			$load = \sys_getloadavg();
			if ( $load && $load[0] > 4.0 ) { // High 1-minute load average
				return true;
			}
		}

		return false;
	}

	/**
	 * Parse PHP memory limit string to bytes.
	 *
	 * @param string $limit Memory limit string (e.g., '128M', '1G').
	 * @return int Memory limit in bytes.
	 */
	public static function parse_memory_limit( string $limit ): int {
		$limit         = trim( $limit );
		$last_char     = strtolower( substr( $limit, -1 ) );
		$numeric_value = (int) substr( $limit, 0, -1 );

		switch ( $last_char ) {
			case 'g':
				return $numeric_value * 1024 * 1024 * 1024;
			case 'm':
				return $numeric_value * 1024 * 1024;
			case 'k':
				return $numeric_value * 1024;
			default:
				return (int) $limit;
		}
	}

	/**
	 * Run competitive benchmark with paired measurements to minimize environmental drift.
	 *
	 * @param callable $scanner_callable Callable for scanner benchmark.
	 * @param callable $parse_callable Callable for parse_blocks benchmark.
	 * @param int      $iterations Number of paired iterations to run.
	 * @return array{scanner_times: float[], parse_times: float[], scanner_mems: int[], parse_mems: int[], result: mixed}
	 */
	public static function run_competitive_benchmark( callable $scanner_callable, callable $parse_callable, int $iterations ): array {
		$scanner_times = array();
		$parse_times   = array();
		$scanner_mems  = array();
		$parse_mems    = array();
		$result        = null;

		// Warmup runs to stabilize opcache/JIT/autoloader effects
		for ( $warmup = 0; $warmup < self::PERF_WARMUP_RUNS; $warmup++ ) {
			$scanner_callable();
			$parse_callable();
		}

		for ( $i = 0; $i < $iterations; $i++ ) {
			// Garbage collection and memory cache cleanup before each iteration
			if ( \function_exists( 'gc_collect_cycles' ) ) {
				\gc_collect_cycles();
			}
			if ( \function_exists( 'gc_mem_caches' ) ) {
				\gc_mem_caches();
			}

			// Alternate order each iteration to avoid order bias
			$run_scanner_first = ( $i % 2 ) === 0;

			if ( $run_scanner_first ) {
				// Run scanner first
				$start_memory    = \memory_get_usage( true );
				$start_time      = \microtime( true );
				$scanner_result  = $scanner_callable();
				$scanner_times[] = \microtime( true ) - $start_time;
				$scanner_mems[]  = max( 0, \memory_get_usage( true ) - $start_memory );
				unset( $scanner_result );

				// Brief cleanup between runs
				if ( \function_exists( 'gc_collect_cycles' ) ) {
					\gc_collect_cycles();
				}

				// Run parse_blocks second
				$start_memory  = \memory_get_usage( true );
				$start_time    = \microtime( true );
				$parse_result  = $parse_callable();
				$parse_times[] = \microtime( true ) - $start_time;
				$parse_mems[]  = max( 0, \memory_get_usage( true ) - $start_memory );
			} else {
				// Run parse_blocks first
				$start_memory  = \memory_get_usage( true );
				$start_time    = \microtime( true );
				$parse_result  = $parse_callable();
				$parse_times[] = \microtime( true ) - $start_time;
				$parse_mems[]  = max( 0, \memory_get_usage( true ) - $start_memory );
				unset( $parse_result );

				// Brief cleanup between runs
				if ( \function_exists( 'gc_collect_cycles' ) ) {
					\gc_collect_cycles();
				}

				// Run scanner second
				$start_memory    = \memory_get_usage( true );
				$start_time      = \microtime( true );
				$scanner_result  = $scanner_callable();
				$scanner_times[] = \microtime( true ) - $start_time;
				$scanner_mems[]  = max( 0, \memory_get_usage( true ) - $start_memory );
			}

			// Keep one result for correctness verification
			// @phan-suppress-next-line PhanImpossibleTypeComparisonInLoop
			if ( null === $result && isset( $scanner_result ) && null !== $scanner_result ) {
				$result = $scanner_result;
				// @phan-suppress-next-line PhanImpossibleTypeComparisonInLoop
			} elseif ( null === $result && isset( $parse_result ) && null !== $parse_result ) {
				$result = $parse_result;
			}

			// Cleanup results to aid memory reuse
			unset( $scanner_result, $parse_result );
		}

		return array(
			'scanner_times' => $scanner_times,
			'parse_times'   => $parse_times,
			'scanner_mems'  => $scanner_mems,
			'parse_mems'    => $parse_mems,
			'result'        => $result,
		);
	}

	/**
	 * Compute trimmed statistic by removing top and bottom 20% and taking median.
	 *
	 * @param array $values Array of numeric values.
	 * @return float Trimmed median value.
	 */
	public static function compute_trimmed_median( array $values ): float {
		if ( empty( $values ) ) {
			return 0.0;
		}

		$sorted = $values;
		sort( $sorted );
		$count = count( $sorted );

		// Remove top and bottom 20%
		$trim_count = (int) floor( $count * 0.2 );
		$trimmed    = array_slice( $sorted, $trim_count, $count - ( 2 * $trim_count ) );

		// @phan-suppress-next-line PhanImpossibleCondition - Can be empty with very small arrays
		if ( empty( $trimmed ) ) {
			return $sorted[ (int) floor( $count / 2 ) ];
		}

		$trimmed_count = count( $trimmed );
		return $trimmed[ (int) floor( $trimmed_count / 2 ) ];
	}

	/**
	 * Assert Block_Scanner has performance advantage using paired benchmark results with robust statistics.
	 *
	 * @param \PHPUnit\Framework\TestCase $test_case Test case instance for assertions.
	 * @param array                       $benchmark_results Results from run_competitive_benchmark().
	 * @param callable                    $scanner_callable Callable for scanner benchmark (for retries).
	 * @param callable                    $parse_callable Callable for parse_blocks benchmark (for retries).
	 */
	public static function assert_performance_advantage_paired( \PHPUnit\Framework\TestCase $test_case, array $benchmark_results, callable $scanner_callable, callable $parse_callable ): void {
		$scanner_times = $benchmark_results['scanner_times'];
		$parse_times   = $benchmark_results['parse_times'];
		$scanner_mems  = $benchmark_results['scanner_mems'];
		$parse_mems    = $benchmark_results['parse_mems'];

		// Compute robust trimmed statistics
		$scanner_time_trimmed = self::compute_trimmed_median( $scanner_times );
		$parse_time_trimmed   = self::compute_trimmed_median( $parse_times );
		$scanner_mem_stat     = self::compute_trimmed_median( $scanner_mems );
		$parse_mem_stat       = self::compute_trimmed_median( $parse_mems );

		// Regression-focused time ratio assertion with extended retry mechanism
		$time_ratio  = $parse_time_trimmed / $scanner_time_trimmed;
		$retry_count = 0;
		$max_retries = 2;

		// Multiple retry attempts for CI stability
		while ( $time_ratio < self::PERF_MIN_TIME_RATIO_THRESHOLD && $retry_count < $max_retries ) {
			$retry_count++;

			// Retry with progressively more iterations for statistical stability
			$retry_iterations = self::PERF_RETRY_BENCHMARK_ITERATIONS + ( $retry_count * 10 );

			$retry_results = self::run_competitive_benchmark(
				$scanner_callable,
				$parse_callable,
				$retry_iterations
			);

			$retry_scanner_time = self::compute_trimmed_median( $retry_results['scanner_times'] );
			$retry_parse_time   = self::compute_trimmed_median( $retry_results['parse_times'] );
			$time_ratio         = $retry_parse_time / $retry_scanner_time;
		}

		// Regression-focused assertion: Scanner should not be significantly slower
		$test_case->assertGreaterThanOrEqual(
			self::PERF_MIN_TIME_RATIO_THRESHOLD,
			$time_ratio,
			sprintf(
				'Scanner performance regression detected (ratio: %.3f, scanner: %.6fs, parse_blocks: %.6fs)',
				$time_ratio,
				$scanner_time_trimmed,
				$parse_time_trimmed
			)
		);

		// Distribution check - majority of runs should not show regression
		$favorable_runs = 0;
		$total_runs     = count( $scanner_times );
		for ( $i = 0; $i < $total_runs; $i++ ) {
			if ( $parse_times[ $i ] >= self::PERF_MIN_TIME_RATIO_THRESHOLD * $scanner_times[ $i ] ) {
				$favorable_runs++;
			}
		}
		$favorable_percentage = ( $favorable_runs / $total_runs ) * 100;
		$test_case->assertGreaterThanOrEqual(
			self::PERF_MIN_FAVORABLE_RUNS_PERCENT,
			$favorable_percentage,
			sprintf(
				'Performance regression in %.1f%% of individual runs (threshold: %d%% must pass)',
				100 - $favorable_percentage,
				self::PERF_MIN_FAVORABLE_RUNS_PERCENT
			)
		);

		// Memory regression check with CI-friendly tolerance (128KB)
		$test_case->assertLessThanOrEqual(
			$parse_mem_stat * 1.10 + self::PERF_MEMORY_TOLERANCE_BYTES,
			$scanner_mem_stat,
			sprintf(
				'Scanner memory should be comparable to parse_blocks (scanner: %d bytes, parse_blocks: %d bytes, tolerance: %d bytes)',
				$scanner_mem_stat,
				$parse_mem_stat,
				self::PERF_MEMORY_TOLERANCE_BYTES
			)
		);
	}
}
