<?php
/**
 * Analytics-aware sync milestone tracker.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\Jetpack\Sync\Modules;

/**
 * Listens for the end of an analytics-relevant Jetpack full sync, persists a
 * one-time milestone option, and exposes that milestone to the frontend via
 * `JetpackScriptData.premium_analytics`.
 *
 * Why this exists: the extracted dashboard needs to distinguish "first-time
 * sync, please wait" from "we have data, render it." Jetpack's existing
 * /jetpack/v4/sync/status endpoint reports current sync state, but not the
 * milestone "the analytics-relevant initial sync has completed at least once",
 * which is what gates the dashboard view. The milestone is also useful for
 * consumer plugins (e.g. WooCommerce Analytics) to fire one-time side-effects
 * like the full-sync-complete email, via the action hook below.
 */
class Sync_Status_Tracker {

	/**
	 * Unix timestamp stored as a non-zero option value once the
	 * analytics-relevant initial full sync has finished. Read by the frontend
	 * to gate the dashboard view.
	 */
	const INITIAL_FULL_SYNC_OPTION = 'jetpack_premium_analytics_initial_full_sync_finished';

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
	 * Action hook fired once when the milestone flips. Consumer plugins use this
	 * to fire one-time side-effects (emails, tracking events, etc.).
	 *
	 * @var string
	 */
	const MILESTONE_ACTION = 'jetpack_premium_analytics_initial_full_sync_finished';

	/**
	 * Wire up the listener and the script-data filter.
	 *
	 * Idempotent: safe to call more than once.
	 *
	 * @return void
	 */
	public static function configure() {
		add_action( 'jetpack_sync_processed_actions', array( self::class, 'on_sync_processed_actions' ) );
		add_filter( 'jetpack_admin_js_script_data', array( self::class, 'inject_script_data' ) );
	}

	/**
	 * On every batch of processed sync actions, look for the analytics-relevant
	 * jetpack_full_sync_end and flip the milestone if it hasn't already fired.
	 *
	 * @param array $actions Processed sync actions.
	 * @return void
	 */
	public static function on_sync_processed_actions( array $actions ): void {
		// Milestone is write-once. Bail before the per-batch full-sync lookup
		// below ($module->get_status() bypasses the status cache) once it fires.
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
	 * Pure-logic counterpart to on_sync_processed_actions(): decide whether the
	 * supplied full-sync status + actions list represents the analytics-relevant
	 * sync ending, and flip the milestone if so.
	 *
	 * Split out so unit tests can exercise the decision without standing up the
	 * Jetpack sync module registry.
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
		update_option( self::INITIAL_FULL_SYNC_OPTION, $finished_at );

		/**
		 * Fires once when the analytics-relevant initial full sync completes.
		 *
		 * @param array $full_status Final full-sync status (with `finished` timestamp).
		 */
		do_action( self::MILESTONE_ACTION, $full_status );
	}

	/**
	 * Inject the milestone value into JetpackScriptData so the dashboard can
	 * read it at page load without an extra HTTP roundtrip.
	 *
	 * @param array $data The script data passed by the assets package.
	 * @return array
	 */
	public static function inject_script_data( array $data ): array {
		$data['premium_analytics'] = array(
			'initial_full_sync_finished' => (int) get_option( self::INITIAL_FULL_SYNC_OPTION, 0 ),
		);

		return $data;
	}

	/**
	 * Whether the analytics-relevant initial full sync milestone has fired.
	 *
	 * @return bool
	 */
	private static function milestone_reached(): bool {
		return (int) get_option( self::INITIAL_FULL_SYNC_OPTION, 0 ) > 0;
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
