<?php
/**
 * One-time full sync that backfills the WooCommerce Analytics lookup data.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\PremiumAnalytics\Analytics;
use Automattic\Jetpack\PremiumAnalytics\Sync\Sync_Status_Tracker;
use Automattic\Jetpack\Sync\Actions;
use Automattic\Jetpack\Sync\Modules;
use DateTimeImmutable;
use Exception;
use Jetpack_Options;

defined( 'ABSPATH' ) || exit;

/**
 * Starts one full sync of the order lookup data and the product catalog on stores whose orders synced before
 * Premium Analytics owned the woocommerce_analytics module, when the standalone plugin stripped the lookup data.
 *
 * Incremental sync and checksums never resend those orders, so WordPress.com keeps their order
 * stats without the product, tax and coupon lookup rows.
 */
class Lookup_Data_Backfill {

	/**
	 * Timestamp of the first full woocommerce_analytics sync that finished under Premium Analytics, which,
	 * unlike the standalone plugin's, sends the lookup data. The backfill also sets it when nothing is missing.
	 */
	const SYNCED_OPTION = 'jetpack_premium_analytics_lookup_data_synced';

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
	 * Seconds to wait before retrying while the full sync cannot start or WordPress.com does not answer.
	 */
	const RETRY_DELAY = 10 * MINUTE_IN_SECONDS;

	/**
	 * Seconds after the first attempt to keep retrying.
	 */
	const RETRY_WINDOW = DAY_IN_SECONDS;

	/**
	 * Set by the standalone WooCommerce Analytics plugin when its first full sync finishes; it survives deactivation.
	 */
	const PLUGIN_FULL_SYNC_OPTION = 'woocommerce_analytics_initial_full_sync_finished';

	/**
	 * Most product and variation IDs to list in the full sync config; above it, all posts are resent.
	 */
	const MAX_PRODUCT_IDS = 5000;

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
		// Priority 11: Sync_Status_Tracker sets the milestone from the stored full sync status at 10.
		add_filter( 'rest_post_dispatch', array( $this, 'on_sync_status_response' ), 11, 3 );
		add_action( 'current_screen', array( $this, 'on_dashboard_screen' ) );
		add_action( self::START_HOOK, array( $this, 'start_backfill' ) );
		add_action( 'jetpack_sync_processed_actions', array( $this, 'on_sync_processed_actions' ) );
	}

	/**
	 * Whether a full woocommerce_analytics sync finished under Premium Analytics, or the backfill found nothing missing.
	 *
	 * @return bool
	 */
	private static function is_synced(): bool {
		return (int) get_option( self::SYNCED_OPTION, 0 ) > 0;
	}

	/**
	 * Whether the first analytics full sync has finished.
	 *
	 * @return bool
	 */
	private static function is_initial_sync_finished(): bool {
		// An older copy of the dashboard package has no accessor; its milestone is this option.
		if ( ! method_exists( Sync_Status_Tracker::class, 'has_initial_sync_finished' ) ) {
			return (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 0 ) > 0;
		}

		return Sync_Status_Tracker::has_initial_sync_finished();
	}

	/**
	 * Mark the lookup data synced when a full sync of the whole woocommerce_analytics module ends.
	 *
	 * Runs even when the milestone exists, since on these stores it may come from the standalone plugin's sync.
	 *
	 * @param array $actions Processed sync actions.
	 * @return void
	 */
	public function on_sync_processed_actions( array $actions ): void {
		if ( self::is_synced() ) {
			return;
		}

		$end_action = null;
		foreach ( $actions as $action ) {
			if ( isset( $action[0] ) && 'jetpack_full_sync_end' === $action[0] ) {
				$end_action = $action;
				break;
			}
		}
		// The end action's own timestamp is the "finished at" value; the stored status is written after it fires.
		$finished_at = isset( $end_action[3] ) ? (int) $end_action[3] : 0;
		if ( $finished_at <= 0 ) {
			return;
		}

		$config = (array) ( $this->get_full_sync_status()['config'] ?? array() );
		// An array config is a date range, a partial sync that leaves the other orders without lookup data.
		if ( empty( $config['woocommerce_analytics'] ) || is_array( $config['woocommerce_analytics'] ) ) {
			return;
		}

		update_option( self::SYNCED_OPTION, $finished_at );
	}

	/**
	 * Check for a backfill when the dashboard polls GET /jetpack/v4/sync/status, which it does until the milestone is set.
	 *
	 * @param mixed $response Result to send to the client. Usually a WP_REST_Response.
	 * @param mixed $server   The REST server instance (unused).
	 * @param mixed $request  The request used to generate the response.
	 * @return mixed The unchanged response.
	 */
	public function on_sync_status_response( $response, $server, $request ) {
		if ( $request instanceof \WP_REST_Request
			&& Sync_Status_Tracker::SYNC_STATUS_ROUTE === $request->get_route()
			&& $response instanceof \WP_REST_Response
			&& ! $response->is_error() ) {
			$this->maybe_schedule();
		}

		return $response;
	}

	/**
	 * Check for a backfill when the dashboard loads, which covers stores whose milestone was set before and no longer poll.
	 *
	 * @return void
	 */
	public function on_dashboard_screen(): void {
		if ( Analytics::is_dashboard_request() ) {
			$this->maybe_schedule();
		}
	}

	/**
	 * Schedule the backfill when an earlier analytics full sync left orders on WordPress.com without lookup data.
	 *
	 * @return void
	 */
	public function maybe_schedule(): void {
		if ( self::is_synced() ) {
			return;
		}

		$state = get_option( self::STATE_OPTION );
		if ( false !== $state && ! $this->forget_lost_run( $state ) ) {
			return;
		}

		// Wait for the first analytics full sync; if it runs under Premium Analytics, its end marks the data synced.
		if ( ! self::is_initial_sync_finished() ) {
			return;
		}

		// Without the standalone plugin's full sync, Premium Analytics sent every order's lookup data itself.
		if ( (int) get_option( self::PLUGIN_FULL_SYNC_OPTION, 0 ) <= 0 || ! $this->has_orders() || ! $this->has_lookup_rows() ) {
			update_option( self::SYNCED_OPTION, time() );
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
	 * Start the full sync unless WordPress.com already holds the order history, or retry later while
	 * Jetpack cannot sync, another full sync runs, or WordPress.com does not answer.
	 *
	 * @param mixed $first_attempt Time of the first attempt; 0 for this one.
	 * @return void
	 */
	public function start_backfill( $first_attempt = 0 ): void {
		$first_attempt = absint( $first_attempt );
		if ( 0 === $first_attempt ) {
			$first_attempt = time();
		}
		$can_retry = time() < $first_attempt + self::RETRY_WINDOW;

		$state = get_option( self::STATE_OPTION );
		$state = is_array( $state ) ? $state : array( 'scheduled_at' => 0 );
		if ( self::is_synced() || ! empty( $state['started_at'] ) ) {
			return;
		}

		if ( $this->is_jetpack_connected() && $this->is_sync_allowed() && ! $this->is_full_sync_running() ) {
			$has_history = $this->wpcom_has_order_history();
			if ( true === $has_history ) {
				update_option( self::SYNCED_OPTION, time() );
				return;
			}

			// Without an answer, start anyway once the retries run out: a needless full sync beats missing history.
			if ( false === $has_history || ! $can_retry ) {
				// Claim the run before starting it, so a concurrent action for it does nothing.
				update_option( self::STATE_OPTION, array_merge( $state, array( 'started_at' => time() ) ) );
				if ( $this->start_full_sync() ) {
					return;
				}
				update_option( self::STATE_OPTION, $state );
			}
		}

		if ( $can_retry ) {
			$this->schedule( time() + self::RETRY_DELAY, $first_attempt );
			return;
		}

		// Give up on this run; the next dashboard check schedules a new one.
		delete_option( self::STATE_OPTION );
	}

	/**
	 * Forget a run whose action is gone or whose full sync another one replaced, or settle one whose end went unnoticed.
	 *
	 * @param array|mixed $state Stored backfill state.
	 * @return bool Whether the run was forgotten, so a new one can be scheduled.
	 */
	private function forget_lost_run( $state ): bool {
		if ( ! is_array( $state ) ) {
			return false;
		}

		if ( empty( $state['started_at'] ) ) {
			// A canceled or failed action leaves nothing to start the run.
			if ( ! function_exists( 'as_has_scheduled_action' ) || as_has_scheduled_action( self::START_HOOK ) ) {
				return false;
			}
			delete_option( self::STATE_OPTION );
			return true;
		}

		$status = $this->get_full_sync_status();
		if ( self::FULL_SYNC_CONTEXT === ( $status['context'] ?? null ) ) {
			if ( empty( $status['finished'] ) ) {
				return false;
			}
			if ( true === ( $status['progress']['woocommerce_analytics']['finished'] ?? false ) ) {
				update_option( self::SYNCED_OPTION, (int) $status['finished'] );
				return false;
			}
		} elseif ( $this->is_full_sync_running() ) {
			// The replacing full sync may include the module; its end marks the data synced if so.
			return false;
		}

		delete_option( self::STATE_OPTION );
		return true;
	}

	/**
	 * Schedule the start action. When Action Scheduler cannot store it, forget the run so a later check schedules it again.
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
	 * Whether WordPress.com reports the product of the oldest completed order, with its type from the product catalog.
	 *
	 * Only lookup rows put the product in the report, and only a synced catalog gives it a type. Orders synced after
	 * Premium Analytics took over carry lookup rows, so only an old order tells whether the history arrived.
	 *
	 * @return bool|null Null when WordPress.com did not answer.
	 */
	protected function wpcom_has_order_history(): ?bool {
		$order = $this->find_oldest_order_product();
		if ( null === $order ) {
			return false;
		}

		try {
			$created = new DateTimeImmutable( $order['date_created'], wp_timezone() );
		} catch ( Exception $e ) {
			return false;
		}

		// A day either side absorbs any time zone difference between the stored date and the report.
		$products = $this->fetch_wpcom_products(
			array(
				'from'      => $created->modify( '-1 day' )->setTime( 0, 0 )->format( 'Y-m-d\TH:i:sP' ),
				'to'        => $created->modify( '+1 day' )->setTime( 23, 59, 59 )->format( 'Y-m-d\TH:i:sP' ),
				'date_type' => 'created',
				'limit'     => 100,
			)
		);
		if ( null === $products ) {
			return null;
		}

		foreach ( $products as $product ) {
			if ( (int) ( $product['product_id'] ?? 0 ) === (int) $order['product_id'] ) {
				return ! empty( $product['product_type'] );
			}
		}
		return false;
	}

	/**
	 * The product and creation date of the oldest completed order with product lookup rows.
	 *
	 * Completed orders are never in WordPress.com's excluded report statuses.
	 *
	 * @return array{product_id: int|string, date_created: string}|null
	 */
	protected function find_oldest_order_product(): ?array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Runs once per store, from the backfill action.
		$row = $wpdb->get_row(
			"SELECT lookup.product_id, stats.date_created
			FROM {$wpdb->prefix}wc_order_stats stats
			INNER JOIN {$wpdb->prefix}wc_order_product_lookup lookup ON lookup.order_id = stats.order_id
			WHERE stats.status = 'wc-completed' AND stats.parent_id = 0
			ORDER BY stats.date_created ASC
			LIMIT 1",
			ARRAY_A
		);

		return is_array( $row ) ? $row : null;
	}

	/**
	 * Fetch rows of the WordPress.com products report, signed as the blog.
	 *
	 * @param array $args Report query arguments.
	 * @return array|null Product rows, or null when the request failed.
	 */
	protected function fetch_wpcom_products( array $args ): ?array {
		// add_query_arg() doesn't encode values, and the date offsets' `+` would arrive as a space.
		$path = add_query_arg( urlencode_deep( $args ), sprintf( '/sites/%d/analytics/reports/products', (int) Jetpack_Options::get_option( 'id' ) ) );

		try {
			$response = Client::wpcom_json_api_request_as_blog( $path, '2', array( 'timeout' => 15 ), null, 'wpcom' );
		} catch ( Exception $e ) {
			return null;
		}

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		return is_array( $body ) && isset( $body['data'] ) && is_array( $body['data'] ) ? $body['data'] : null;
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
	 * The stored full sync status.
	 *
	 * @return array
	 */
	protected function get_full_sync_status(): array {
		$module = Modules::get_module( 'full-sync' );
		if ( ! $module ) {
			return array();
		}
		'@phan-var \Automattic\Jetpack\Sync\Modules\Full_Sync_Immediately|\Automattic\Jetpack\Sync\Modules\Full_Sync $module';

		return (array) $module->get_status();
	}

	/**
	 * IDs of all products and variations.
	 *
	 * @return int[]
	 */
	protected function get_product_ids(): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Runs once per store, from the backfill action.
		return array_map( 'intval', $wpdb->get_col( "SELECT ID FROM {$wpdb->posts} WHERE post_type IN ( 'product', 'product_variation' ) ORDER BY ID" ) );
	}

	/**
	 * Start the full sync of the order lookup data and the product catalog.
	 *
	 * WordPress.com builds its product table from synced product posts and their product_type terms, which it
	 * ignored before it knew an analytics plugin was active. Modules are sent in this order: terms before posts.
	 *
	 * @return bool Whether Jetpack started it.
	 */
	private function start_full_sync(): bool {
		$config      = array( 'woocommerce_analytics' => true );
		$product_ids = $this->get_product_ids();
		if ( $product_ids ) {
			// term_relationships can't be limited to IDs; posts can, and only products build the catalog. Full sync rewrites its
			// status, config included, after every batch, so a large catalog resends all posts, which are then mostly products.
			$config += array(
				'terms'              => true,
				'term_relationships' => true,
				'posts'              => count( $product_ids ) > self::MAX_PRODUCT_IDS ? true : $product_ids,
			);
		}

		return $this->do_full_sync( $config );
	}

	/**
	 * Start a full sync with the backfill's context.
	 *
	 * @param array $config Full sync config by module name.
	 * @return bool Whether Jetpack started it.
	 */
	protected function do_full_sync( array $config ): bool {
		return Actions::do_full_sync( $config, self::FULL_SYNC_CONTEXT );
	}
}
