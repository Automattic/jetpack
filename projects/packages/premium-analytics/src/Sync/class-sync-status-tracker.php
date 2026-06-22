<?php
/**
 * Analytics-aware sync milestone tracker.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\Jetpack\Sync\Modules;

/**
 * Listens for the end of the dashboard-gating Jetpack full sync, persists a
 * one-time milestone option, and exposes that milestone to the frontend both at
 * page load (via `JetpackScriptData.premium_analytics`) and live on Jetpack's
 * `/jetpack/v4/sync/status` REST response.
 *
 * Which sync gates the dashboard is resolved live from `has_store_data`: the
 * analytics-module sync ({@see INITIAL_ANALYTICS_SYNC_OPTION}) for store sites,
 * Jetpack's generic initial full sync ({@see INITIAL_SITE_SYNC_OPTION}) otherwise.
 * The two are tracked separately so connecting without WooCommerce and activating
 * it later still waits for store data.
 *
 * Why this exists: the extracted dashboard needs to distinguish "first-time
 * sync, please wait" from "we have data, render it." Jetpack's
 * /jetpack/v4/sync/status reports current sync state, but not whether the
 * gating initial sync has completed at least once. The analytics milestone also
 * lets consumer plugins (e.g. WooCommerce Analytics) fire one-time side-effects
 * like the full-sync-complete email, via the action hook below.
 */
class Sync_Status_Tracker {

	/**
	 * Milestone (unix ts) for the analytics-module initial full sync. Gates the
	 * dashboard when the site has store data. Separate from
	 * {@see INITIAL_SITE_SYNC_OPTION} so activating WooCommerce after a storeless
	 * connect still waits for store data.
	 */
	const INITIAL_ANALYTICS_SYNC_OPTION = 'jetpack_premium_analytics_initial_analytics_sync_finished';

	/**
	 * Milestone (unix ts) for Jetpack's generic initial full sync. Gates the
	 * dashboard when the site has no store data.
	 */
	const INITIAL_SITE_SYNC_OPTION = 'jetpack_premium_analytics_initial_site_sync_finished';

	/**
	 * Default sync-module names whose end-of-sync event flips the milestone.
	 * Currently provided by WooCommerce Analytics, which registers a custom
	 * full-sync module under this key. Consumers can extend or override the set
	 * via the `jetpack_premium_analytics_sync_modules` filter — see
	 * {@see get_analytics_sync_modules()}.
	 *
	 * @var string[]
	 */
	const ANALYTICS_SYNC_MODULES = array( 'woocommerce_analytics' );

	/**
	 * Action hook fired once when the analytics milestone flips (not the storeless
	 * site milestone). Consumer plugins use this to fire one-time side-effects keyed
	 * to store data (emails, tracking events, etc.).
	 *
	 * @var string
	 */
	const MILESTONE_ACTION = 'jetpack_premium_analytics_initial_full_sync_finished';

	/**
	 * Jetpack core's sync-status REST route. We enrich this existing response with
	 * the milestone rather than registering a dedicated endpoint.
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
	 * Append the milestone to Jetpack core's GET /jetpack/v4/sync/status response
	 * so the dashboard can read it on every poll, not just at page load.
	 *
	 * Page-load script-data ({@see inject_script_data()}) is a one-time snapshot;
	 * reading the milestone here keeps it live for in-session completion without a
	 * dedicated endpoint. Only the already-authorized, successful status payload is
	 * touched — other routes and error responses pass through untouched.
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
			$data['initial_full_sync_finished'] = self::gating_milestone( Configuration::is_woocommerce_active() );
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
		$has_store_data = Configuration::is_woocommerce_active();

		// Bail before the per-batch full-sync lookup ($module->get_status() bypasses
		// the status cache) once the current mode's milestone is set. Resolving the
		// mode live means activating WooCommerce later resumes the store milestone.
		if ( self::milestone_reached( $has_store_data ) ) {
			return;
		}

		$module = Modules::get_module( 'full-sync' );
		if ( ! $module ) {
			return;
		}
		'@phan-var \Automattic\Jetpack\Sync\Modules\Full_Sync_Immediately|\Automattic\Jetpack\Sync\Modules\Full_Sync $module';

		self::maybe_set_milestone( $module->get_status(), $actions, $has_store_data );
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
	 * Pure-logic counterpart to on_sync_processed_actions(): decide whether the
	 * supplied full-sync status + actions list represents the sync that gates the
	 * dashboard ending, and flip the milestone if so.
	 *
	 * Store site: only a full sync whose config includes an analytics module flips
	 * the milestone, so a generic sync can't open the gate before store data lands.
	 * Storeless site: any initial full sync ending flips it. The milestone written
	 * tracks `$has_store_data`, in lockstep with the option the frontend reads.
	 *
	 * Split out so unit tests can exercise the decision without the Jetpack sync
	 * module registry (the caller resolves `$has_store_data` live).
	 *
	 * @param array $full_status    Result of Full_Sync_Immediately::get_status().
	 * @param array $actions        Processed sync actions.
	 * @param bool  $has_store_data Whether the site has store data to sync (WooCommerce
	 *                              active). Defaults to true: require the analytics module.
	 * @return void
	 */
	public static function maybe_set_milestone( array $full_status, array $actions, bool $has_store_data = true ): void {
		if ( self::milestone_reached( $has_store_data ) ) {
			return;
		}

		if ( $has_store_data ) {
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
		}

		$end_action = self::find_full_sync_end_action( $actions );
		if ( ! $end_action ) {
			return;
		}

		// The last update_status() call in Full_Sync_Immediately::send() runs
		// after jetpack_full_sync_end fires, so the action's own timestamp is
		// the most reliable "finished at" value. Note: Year 2038 problem.
		$finished_at = isset( $end_action[3] ) ? (int) $end_action[3] : 0;
		if ( $finished_at <= 0 ) {
			// Defensive: avoid persisting a zero timestamp, which would equal
			// the "not yet set" sentinel and cause the listener to re-trigger
			// on the next batch.
			return;
		}
		$full_status['finished'] = $finished_at;
		update_option( self::gating_option( $has_store_data ), $finished_at );

		if ( ! $has_store_data ) {
			// No store data, so store-keyed consumer side-effects (e.g. WooCommerce's
			// full-sync-complete email) must not fire — only the analytics milestone does.
			return;
		}

		/**
		 * Fires once when the analytics-relevant initial full sync completes.
		 *
		 * @param array $full_status Final full-sync status (with `finished` timestamp).
		 */
		do_action( self::MILESTONE_ACTION, $full_status );
	}

	/**
	 * Inject the milestone and store-data flag into JetpackScriptData so the
	 * dashboard can read them at page load without an extra HTTP roundtrip.
	 *
	 * `has_store_data` tells the frontend which sync gates the dashboard: the
	 * analytics module when WooCommerce is active, or Jetpack's generic initial
	 * full sync when it is not. Computed live so activating WooCommerce later is
	 * picked up on the next page load.
	 *
	 * @param array $data The script data passed by the assets package.
	 * @return array
	 */
	public static function inject_script_data( array $data ): array {
		$has_store_data            = Configuration::is_woocommerce_active();
		$data['premium_analytics'] = array(
			'initial_full_sync_finished' => self::gating_milestone( $has_store_data ),
			'has_store_data'             => $has_store_data,
		);

		return $data;
	}

	/**
	 * The option name whose timestamp gates the dashboard for the given mode.
	 *
	 * @param bool $has_store_data Whether the site has store data (WooCommerce active).
	 * @return string
	 */
	private static function gating_option( bool $has_store_data ): string {
		return $has_store_data ? self::INITIAL_ANALYTICS_SYNC_OPTION : self::INITIAL_SITE_SYNC_OPTION;
	}

	/**
	 * The gating milestone timestamp for the given mode (0 if not yet reached).
	 *
	 * @param bool $has_store_data Whether the site has store data (WooCommerce active).
	 * @return int
	 */
	private static function gating_milestone( bool $has_store_data ): int {
		return (int) get_option( self::gating_option( $has_store_data ), 0 );
	}

	/**
	 * Whether the milestone gating the given mode has fired.
	 *
	 * @param bool $has_store_data Whether the site has store data (WooCommerce active).
	 * @return bool
	 */
	private static function milestone_reached( bool $has_store_data ): bool {
		return self::gating_milestone( $has_store_data ) > 0;
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
