<?php
/**
 * Wpcom Dashboard feature.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;

/**
 * Manages the WordPress.com Dashboard replacement holdout experiment.
 */
class Wpcom_Dashboard {

	const EXPERIMENT_NAME                = 'wpcom_custom_dashboard_holdout'; // Temporary name!
	const EXPERIMENT_TREATMENT_VARIATION = 'treatment';

	/**
	 * Initialize the feature.
	 */
	public static function init() {
		add_filter( 'wpcom_dashboard_replacement_enabled', array( __CLASS__, 'is_feature_flag_enabled' ) );
		add_filter( 'wpcom_dashboard_replacement_holdout_is_treatment', array( __CLASS__, 'is_holdout_treatment' ) );
		add_action( 'admin_notices', array( __CLASS__, 'render_admin_notice' ) );
	}

	/**
	 * Feature flag filter callback. Defaults to false.
	 * Override this filter to true to force-enable for testing.
	 *
	 * @param bool $enabled Whether the feature is enabled.
	 * @return bool
	 */
	public static function is_feature_flag_enabled( $enabled = false ) {
		return (bool) $enabled;
	}

	/**
	 * Check whether the current user is in the holdout treatment group.
	 *
	 * On Simple sites, uses \ExPlat\assign_current_user() directly.
	 * On Atomic sites with a connected user, uses the REST API.
	 * Caches the result in a transient for 1 hour.
	 *
	 * @param bool $is_treatment Whether the user is in the treatment group.
	 * @return bool
	 */
	public static function is_holdout_treatment( $is_treatment = false ) {
		// Respect earlier filter overrides.
		if ( $is_treatment ) {
			return true;
		}

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return false;
		}

		$cache_key     = 'wpcom-dashboard-holdout-' . $user_id . '-' . self::EXPERIMENT_NAME;
		$cached_result = get_transient( $cache_key );

		if ( false !== $cached_result ) {
			return (bool) $cached_result;
		}

		$result = false;

		if ( ( new Host() )->is_wpcom_simple() ) {
			if ( function_exists( '\ExPlat\assign_current_user' ) ) {
				$result = self::EXPERIMENT_TREATMENT_VARIATION === \ExPlat\assign_current_user( self::EXPERIMENT_NAME );
			}
		} elseif ( ( new Connection_Manager() )->is_user_connected() ) {
			$request_path = '/experiments/0.1.0/assignments/wpcom';
			$response     = Client::wpcom_json_api_request_as_user(
				add_query_arg( array( 'experiment_name' => self::EXPERIMENT_NAME ), $request_path ),
				'v2'
			);

			if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
				$data = json_decode( wp_remote_retrieve_body( $response ), true );
				if ( isset( $data['variations'][ self::EXPERIMENT_NAME ] ) ) {
					$result = self::EXPERIMENT_TREATMENT_VARIATION === $data['variations'][ self::EXPERIMENT_NAME ];
				}
			}
		}

		set_transient( $cache_key, $result ? 1 : 0, HOUR_IN_SECONDS );

		return $result;
	}

	/**
	 * Whether the dashboard replacement is active.
	 *
	 * Returns true if the feature flag is enabled OR the holdout experiment
	 * assigns the user to the treatment group.
	 *
	 * @return bool
	 */
	public static function is_active() {
		/** This filter is documented in class-wpcom-dashboard.php */
		$feature_flag = apply_filters( 'wpcom_dashboard_replacement_enabled', false );

		if ( $feature_flag ) {
			return true;
		}

		/** This filter is documented in class-wpcom-dashboard.php */
		return (bool) apply_filters( 'wpcom_dashboard_replacement_holdout_is_treatment', false );
	}

	/**
	 * Render an admin notice on the Dashboard page showing the current state.
	 * Temporary dev aid — remove before shipping.
	 */
	public static function render_admin_notice() {
		if ( ! self::is_active() ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || 'dashboard' !== $screen->id ) {
			return;
		}

		/** This filter is documented in class-wpcom-dashboard.php */
		$is_treatment = (bool) apply_filters( 'wpcom_dashboard_replacement_holdout_is_treatment', false );

		$status = $is_treatment ? 'active/treatment' : 'active/control';
		$type   = $is_treatment ? 'success' : 'info';

		printf(
			'<div class="notice notice-%s"><p>%s</p></div>',
			esc_attr( $type ),
			esc_html(
				sprintf(
					/* translators: %s is "active/treatment" or "active/control". */
					__( 'Dashboard replacement: %s', 'jetpack-mu-wpcom' ),
					$status
				)
			)
		);
	}
}
