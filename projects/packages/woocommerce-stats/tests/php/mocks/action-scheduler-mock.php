<?php
/**
 * Stubs the Action Scheduler functions the lookup data backfill calls, recording scheduled actions
 * in `$GLOBALS['woocommerce_stats_test_scheduled_actions']`.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

// phpcs:disable WordPress.Files.FileName, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

if ( ! function_exists( 'as_schedule_single_action' ) ) {
	/**
	 * Stub of Action Scheduler's single-action scheduling; records the call in $GLOBALS['woocommerce_stats_test_scheduled_actions'].
	 */
	function as_schedule_single_action( $timestamp, $hook, $args = array(), $group = '', $unique = false, $priority = 10 ) {
		$GLOBALS['woocommerce_stats_test_scheduled_actions'][] = compact( 'timestamp', 'hook', 'args' );
		return count( $GLOBALS['woocommerce_stats_test_scheduled_actions'] );
	}
}

if ( ! function_exists( 'as_has_scheduled_action' ) ) {
	/**
	 * Stub of Action Scheduler's pending-action check, backed by as_schedule_single_action()'s records.
	 */
	function as_has_scheduled_action( $hook, $args = null, $group = '' ) {
		return in_array( $hook, array_column( $GLOBALS['woocommerce_stats_test_scheduled_actions'] ?? array(), 'hook' ), true );
	}
}
