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
		add_filter( 'screen_layout_columns', array( __CLASS__, 'limit_dashboard_columns' ) );
		add_filter( 'get_user_option_screen_layout_dashboard', array( __CLASS__, 'cap_dashboard_column_preference' ) );
		add_filter( 'get_user_option_meta-box-order_dashboard', array( __CLASS__, 'redistribute_meta_box_order' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_dashboard_styles' ) );
	}

	/**
	 * Whether the current user is in the holdout treatment group.
	 *
	 * Checks the ExPlat experiment assignment. On Simple sites, uses
	 * \ExPlat\assign_current_user() directly. On Atomic sites with a
	 * connected user, uses the REST API.
	 * Caches the result in a transient for 1 hour.
	 *
	 * The result can be overridden via the
	 * {@see 'wpcom_dashboard_override_is_treatment'} filter.
	 *
	 * @return bool
	 */
	public static function is_treatment() {
		/**
		 * Overrides the holdout experiment assignment.
		 * Return true to force-enable the treatment for testing.
		 *
		 * @param bool|null $override Return a bool to override, or null to use the experiment value.
		 */
		$override = apply_filters( 'wpcom_dashboard_override_is_treatment', null );

		if ( null !== $override ) {
			return (bool) $override;
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
	 * Enqueue responsive dashboard column styles on the Dashboard screen.
	 *
	 * @param string $hook_suffix The current admin page hook suffix.
	 */
	public static function enqueue_dashboard_styles( $hook_suffix ) {
		if ( 'index.php' !== $hook_suffix || ! self::is_treatment() ) {
			return;
		}

		wp_enqueue_style(
			'wpcom-dashboard-styles',
			plugins_url( 'wpcom-dashboard.css', __FILE__ ),
			array(),
			\Automattic\Jetpack\Jetpack_Mu_Wpcom::PACKAGE_VERSION
		);
	}

	/**
	 * Limit the dashboard screen to a maximum of 2 columns.
	 *
	 * @param array $columns Screen layout columns keyed by screen ID.
	 * @return array
	 */
	public static function limit_dashboard_columns( $columns ) {
		if ( ! self::is_treatment() ) {
			return $columns;
		}

		$columns['dashboard'] = 2;

		return $columns;
	}

	/**
	 * Cap the user's saved dashboard column preference to 2.
	 *
	 * @param int|false $value The user's saved column count, or false if not set.
	 * @return int|false
	 */
	public static function cap_dashboard_column_preference( $value ) {
		if ( ! self::is_treatment() ) {
			return $value;
		}

		if ( false !== $value && (int) $value > 2 ) {
			return 2;
		}

		return $value;
	}

	/**
	 * Move widgets from columns 3 and 4 into columns 1 and 2.
	 *
	 * WordPress stores the dashboard meta box order as an array with keys:
	 * 'normal' (column 1), 'side' (column 2), 'column3', 'column4'.
	 *
	 * @param array|false $order The saved meta box order, or false if not set.
	 * @return array|false
	 */
	public static function redistribute_meta_box_order( $order ) {
		if ( ! self::is_treatment() || ! is_array( $order ) ) {
			return $order;
		}

		// Append column3 widgets to normal (column 1).
		if ( ! empty( $order['column3'] ) ) {
			$order['normal']  = self::merge_widget_lists( $order['normal'] ?? '', $order['column3'] );
			$order['column3'] = '';
		}

		// Append column4 widgets to side (column 2).
		if ( ! empty( $order['column4'] ) ) {
			$order['side']    = self::merge_widget_lists( $order['side'] ?? '', $order['column4'] );
			$order['column4'] = '';
		}

		return $order;
	}

	/**
	 * Merge two comma-separated widget ID lists.
	 *
	 * @param string $target Existing comma-separated list.
	 * @param string $source List to append.
	 * @return string
	 */
	private static function merge_widget_lists( $target, $source ) {
		$target = trim( $target, ',' );
		$source = trim( $source, ',' );

		if ( '' === $target ) {
			return $source;
		}

		if ( '' === $source ) {
			return $target;
		}

		return $target . ',' . $source;
	}
}
