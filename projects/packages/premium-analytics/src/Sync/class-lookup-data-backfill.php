<?php
/**
 * One-time full sync that backfills the WooCommerce Analytics lookup data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Sync\Actions;
use Automattic\Jetpack\Sync\Modules;

defined( 'ABSPATH' ) || exit;

/**
 * Starts one woocommerce_analytics full sync on stores whose orders synced before Premium Analytics
 * owned the module, when the standalone WooCommerce Analytics plugin stripped the lookup data.
 *
 * Incremental sync and checksums never resend those orders, so WordPress.com keeps their order
 * stats without the product, tax and coupon lookup rows.
 */
class Lookup_Data_Backfill {

	/**
	 * Option holding the backfill state: `scheduled_at` and `started_at` timestamps. Delete it to run the backfill again.
	 */
	const STATE_OPTION = 'jetpack_premium_analytics_lookup_backfill';

	/**
	 * Action Scheduler hook that starts the full sync.
	 */
	const START_HOOK = 'jetpack_premium_analytics_lookup_backfill';

	/**
	 * Full sync context, so the backfill can be told apart in the sync status.
	 */
	const FULL_SYNC_CONTEXT = 'premium_analytics_lookup_backfill';

	/**
	 * Seconds to wait before retrying while the full sync cannot start.
	 */
	const RETRY_DELAY = 10 * MINUTE_IN_SECONDS;

	/**
	 * Seconds after the first attempt to keep retrying.
	 */
	const RETRY_WINDOW = DAY_IN_SECONDS;

	/**
	 * Lookup tables the standalone plugin left out of its sync.
	 */
	const LOOKUP_TABLES = array( 'wc_order_product_lookup', 'wc_order_tax_lookup', 'wc_order_coupon_lookup' );

	/**
	 * Register the hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'admin_init', array( $this, 'maybe_schedule' ) );
		add_action( self::START_HOOK, array( $this, 'start_backfill' ) );
	}

	/**
	 * Schedule the backfill when an earlier analytics full sync left orders on WordPress.com without lookup data.
	 *
	 * @return void
	 */
	public function maybe_schedule(): void {
		if ( Sync_Status_Tracker::lookup_data_synced() || false !== get_option( self::STATE_OPTION ) ) {
			return;
		}

		// Wait for the first analytics full sync; if it runs under Premium Analytics, the tracker marks the data synced.
		if ( ! $this->has_finished_analytics_full_sync() ) {
			return;
		}

		if ( ! $this->has_orders() || ! $this->has_lookup_rows() ) {
			update_option( Sync_Status_Tracker::LOOKUP_DATA_SYNCED_OPTION, time() );
			return;
		}

		if ( ! function_exists( 'as_schedule_single_action' ) || as_has_scheduled_action( self::START_HOOK ) ) {
			return;
		}

		update_option(
			self::STATE_OPTION,
			array(
				'scheduled_at' => time(),
				'started_at'   => 0,
			)
		);
		$this->schedule( time(), 0 );
	}

	/**
	 * Start the full sync, or retry later while Jetpack cannot sync or another full sync runs.
	 *
	 * @param mixed $first_attempt Time of the first attempt; 0 for this one.
	 * @return void
	 */
	public function start_backfill( $first_attempt = 0 ): void {
		$first_attempt = absint( $first_attempt );
		if ( 0 === $first_attempt ) {
			$first_attempt = time();
		}

		$state = get_option( self::STATE_OPTION );
		$state = is_array( $state ) ? $state : array( 'scheduled_at' => 0 );
		if ( Sync_Status_Tracker::lookup_data_synced() || ! empty( $state['started_at'] ) ) {
			return;
		}

		if ( $this->is_jetpack_connected() && $this->is_sync_allowed() && ! $this->is_full_sync_running() ) {
			// Claim the run before starting it, so a concurrent action for it does nothing.
			update_option( self::STATE_OPTION, array_merge( $state, array( 'started_at' => time() ) ) );
			if ( $this->start_full_sync() ) {
				return;
			}
			update_option( self::STATE_OPTION, $state );
		}

		if ( time() < $first_attempt + self::RETRY_WINDOW ) {
			$this->schedule( time() + self::RETRY_DELAY, $first_attempt );
		}
	}

	/**
	 * Schedule the start action. When Action Scheduler cannot store it, forget the run so a later admin request schedules it again.
	 *
	 * @param int $timestamp     When the action runs.
	 * @param int $first_attempt Time of the first attempt; 0 when this schedules the first one.
	 * @return void
	 */
	private function schedule( int $timestamp, int $first_attempt ): void {
		if ( ! as_schedule_single_action( $timestamp, self::START_HOOK, array( $first_attempt ) ) ) {
			delete_option( self::STATE_OPTION );
		}
	}

	/**
	 * Whether a full sync including woocommerce_analytics has finished, from the milestone or the stored full sync status.
	 *
	 * @return bool
	 */
	private function has_finished_analytics_full_sync(): bool {
		if ( (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 0 ) > 0 ) {
			return true;
		}

		$module = Modules::get_module( 'full-sync' );
		if ( ! $module ) {
			return false;
		}
		'@phan-var \Automattic\Jetpack\Sync\Modules\Full_Sync_Immediately|\Automattic\Jetpack\Sync\Modules\Full_Sync $module';

		$status = $module->get_status();
		return ! empty( $status['finished'] ) && true === ( $status['progress']['woocommerce_analytics']['finished'] ?? false );
	}

	/**
	 * Whether WooCommerce Analytics holds any order stats.
	 *
	 * @return bool
	 */
	protected function has_orders(): bool {
		return self::table_has_rows( 'wc_order_stats' );
	}

	/**
	 * Whether any WooCommerce Analytics lookup table has rows.
	 *
	 * @return bool
	 */
	protected function has_lookup_rows(): bool {
		foreach ( self::LOOKUP_TABLES as $table ) {
			if ( self::table_has_rows( $table ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Whether a WooCommerce table has at least one row; a missing table has none.
	 *
	 * @param string $table Table name without the prefix.
	 * @return bool
	 */
	private static function table_has_rows( string $table ): bool {
		global $wpdb;

		$suppress = $wpdb->suppress_errors();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name from a constant list; runs until the backfill is scheduled or marked done.
		$row = $wpdb->get_var( "SELECT 1 FROM `{$wpdb->prefix}{$table}` LIMIT 1" );
		$wpdb->suppress_errors( $suppress );

		return null !== $row;
	}

	/**
	 * Whether the site is connected to WordPress.com.
	 *
	 * @return bool
	 */
	protected function is_jetpack_connected(): bool {
		return ( new Connection_Manager() )->is_connected();
	}

	/**
	 * Whether Jetpack allows syncing (not offline, in safe mode, or with sync disabled).
	 *
	 * @return bool
	 */
	protected function is_sync_allowed(): bool {
		return Actions::sync_allowed();
	}

	/**
	 * Whether another full sync is running.
	 *
	 * @return bool
	 */
	protected function is_full_sync_running(): bool {
		$module = Modules::get_module( 'full-sync' );
		if ( ! $module ) {
			return false;
		}
		'@phan-var \Automattic\Jetpack\Sync\Modules\Full_Sync_Immediately|\Automattic\Jetpack\Sync\Modules\Full_Sync $module';

		return $module->is_started() && ! $module->is_finished();
	}

	/**
	 * Start the woocommerce_analytics full sync.
	 *
	 * @return bool Whether Jetpack started it.
	 */
	protected function start_full_sync(): bool {
		return Actions::do_full_sync( array( 'woocommerce_analytics' => true ), self::FULL_SYNC_CONTEXT );
	}
}
