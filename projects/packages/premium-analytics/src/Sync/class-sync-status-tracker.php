<?php
/**
 * Analytics-aware sync milestone tracker.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\Jetpack\Sync\Modules;

/**
 * Listens for the end of the analytics full sync and persists a one-time milestone option.
 *
 * /jetpack/v4/sync/status reports current sync state but not whether the analytics full sync
 * has completed at least once — which is what tells the dashboard's store section its numbers are complete.
 */
class Sync_Status_Tracker {

	/**
	 * Milestone (unix ts) for the analytics-module initial full sync. Marks the
	 * dashboard's store data as complete.
	 */
	const INITIAL_ANALYTICS_SYNC_OPTION = 'jetpack_premium_analytics_initial_analytics_sync_finished';

	/**
	 * Default sync-module names whose end-of-sync event flips the milestone. Provided by
	 * WooCommerce Analytics, which registers a custom full-sync module under this key.
	 *
	 * @var string[]
	 */
	const ANALYTICS_SYNC_MODULES = array( 'woocommerce_analytics' );

	/**
	 * Action hook fired once when the analytics milestone flips. Consumer plugins
	 * use this to fire one-time side-effects keyed to store data (emails, tracking
	 * events, etc.).
	 *
	 * @var string
	 */
	const MILESTONE_ACTION = 'jetpack_premium_analytics_initial_full_sync_finished';

	/**
	 * Jetpack core's sync-status REST route, enriched with the milestone.
	 */
	const SYNC_STATUS_ROUTE = '/jetpack/v4/sync/status';

	/**
	 * Wire up the listener, the script-data filter, and the sync-status enricher.
	 *
	 * Idempotent: safe to call more than once.
	 *
	 * @return void
	 */
	public static function configure() {
		add_action( 'jetpack_sync_processed_actions', array( self::class, 'on_sync_processed_actions' ) );
		add_filter( 'jetpack_admin_js_script_data', array( self::class, 'inject_script_data' ) );
		add_filter( 'rest_post_dispatch', array( self::class, 'enrich_sync_status_response' ), 10, 3 );
	}

	/**
	 * Append the milestone to Jetpack core's GET /jetpack/v4/sync/status response.
	 *
	 * Unlike the one-time script-data snapshot ({@see inject_script_data()}), this stays live for
	 * in-session completion — but touches only the already-authorized, successful status payload.
	 *
	 * @param mixed $response Result to send to the client. Usually a WP_REST_Response.
	 * @param mixed $server   The REST server instance (unused).
	 * @param mixed $request  The request used to generate the response.
	 * @return mixed
	 */
	public static function enrich_sync_status_response( $response, $server, $request ) {
		if ( ! $request instanceof \WP_REST_Request
			|| self::SYNC_STATUS_ROUTE !== $request->get_route()
			|| ! $response instanceof \WP_REST_Response
			|| $response->is_error() ) {
			return $response;
		}

		$data = $response->get_data();
		if ( is_array( $data ) ) {
			$data['initial_full_sync_finished'] = self::milestone();
			$response->set_data( $data );
		}

		return $response;
	}

	/**
	 * On every batch of processed sync actions, look for the gating
	 * jetpack_full_sync_end and flip the milestone if it hasn't already fired.
	 *
	 * @param array $actions Processed sync actions.
	 * @return void
	 */
	public static function on_sync_processed_actions( array $actions ): void {
		// Bail before the per-batch full-sync lookup ($module->get_status() bypasses
		// the status cache) once the milestone is set.
		if ( self::milestone_reached() ) {
			return;
		}

		$module = Modules::get_module( 'full-sync' );
		if ( ! $module ) {
			return;
		}
		'@phan-var \Automattic\Jetpack\Sync\Modules\Full_Sync_Immediately|\Automattic\Jetpack\Sync\Modules\Full_Sync $module';

		self::maybe_set_milestone( $module->get_status(), $actions );
	}

	/**
	 * Resolve the configured sync-module names for analytics.
	 *
	 * @return string[]
	 */
	public static function get_analytics_sync_modules(): array {
		/**
		 * Filter the sync-module names whose end-of-sync flips the analytics
		 * milestone. Consumer plugins that register custom full-sync modules
		 * can add their module keys here.
		 *
		 * @param string[] $module_names Default: array( 'woocommerce_analytics' ).
		 */
		return (array) apply_filters( 'jetpack_premium_analytics_sync_modules', self::ANALYTICS_SYNC_MODULES );
	}

	/**
	 * Decide whether the supplied full-sync status and actions represent the analytics sync ending.
	 *
	 * Only a full sync whose config includes an analytics module counts — a generic sync can't mark
	 * store data complete; split out so tests can exercise it without the sync module registry.
	 *
	 * @param array $full_status Result of Full_Sync_Immediately::get_status().
	 * @param array $actions     Processed sync actions.
	 * @return void
	 */
	public static function maybe_set_milestone( array $full_status, array $actions ): void {
		if ( self::milestone_reached() ) {
			return;
		}

		$config = isset( $full_status['config'] ) ? (array) $full_status['config'] : array();
		$active = array_filter(
			self::get_analytics_sync_modules(),
			static function ( $module_name ) use ( $config ) {
				return ! empty( $config[ $module_name ] );
			}
		);
		if ( ! $active ) {
			return;
		}

		$end_action = self::find_full_sync_end_action( $actions );
		if ( ! $end_action ) {
			return;
		}

		// The last update_status() call in Full_Sync_Immediately::send() runs after jetpack_full_sync_end
		// fires, so the action's own timestamp is the most reliable "finished at" value (Year 2038 problem aside).
		$finished_at = isset( $end_action[3] ) ? (int) $end_action[3] : 0;
		if ( $finished_at <= 0 ) {
			// Defensive: avoid persisting a zero timestamp, which would equal the "not yet set" sentinel
			// and cause the listener to re-trigger on the next batch.
			return;
		}
		$full_status['finished'] = $finished_at;
		update_option( self::INITIAL_ANALYTICS_SYNC_OPTION, $finished_at );

		/**
		 * Fires once when the analytics-relevant initial full sync completes.
		 *
		 * @param array $full_status Final full-sync status (with `finished` timestamp).
		 */
		do_action( self::MILESTONE_ACTION, $full_status );
	}

	/**
	 * Inject the milestone into JetpackScriptData so the dashboard can read it at
	 * page load without an extra HTTP roundtrip.
	 *
	 * @param array $data The script data passed by the assets package.
	 * @return array
	 */
	public static function inject_script_data( array $data ): array {
		$data['premium_analytics'] = array(
			'initial_full_sync_finished' => self::milestone(),
		);

		return $data;
	}

	/**
	 * The milestone timestamp (0 if not yet reached).
	 *
	 * @return int
	 */
	private static function milestone(): int {
		return (int) get_option( self::INITIAL_ANALYTICS_SYNC_OPTION, 0 );
	}

	/**
	 * Whether the milestone has fired.
	 *
	 * @return bool
	 */
	private static function milestone_reached(): bool {
		return self::milestone() > 0;
	}

	/**
	 * Find the jetpack_full_sync_end action in a processed-actions list.
	 *
	 * @param array $actions Actions list.
	 * @return array|null
	 */
	private static function find_full_sync_end_action( array $actions ): ?array {
		foreach ( $actions as $action ) {
			if ( isset( $action[0] ) && 'jetpack_full_sync_end' === $action[0] ) {
				return $action;
			}
		}
		return null;
	}
}
