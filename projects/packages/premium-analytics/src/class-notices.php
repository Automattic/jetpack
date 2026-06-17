<?php
/**
 * Computes the dashboard notices, merging WPCOM-stored dismissals with locally-derived flags.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Jetpack_Options;
use WP_Error;

/**
 * Ported from `Automattic\Jetpack\Stats_Admin\Notices` so premium-analytics owns the notices
 * surface without depending on the (to-be-deprecated) stats-admin package. The WPCOM dismissal
 * state is fetched/updated through the blog token; the opt-in/opt-out/feedback/GDPR flags are
 * derived locally from `Stats\Options` and the environment.
 */
class Notices {
	const NOTICES_CACHE_KEY             = 'jetpack_premium_analytics_notices_cache_key';
	const OPT_OUT_NEW_STATS_NOTICE_ID   = 'opt_out_new_stats';
	const NEW_STATS_FEEDBACK_NOTICE_ID  = 'new_stats_feedback';
	const OPT_IN_NEW_STATS_NOTICE_ID    = 'opt_in_new_stats';
	const GDPR_COOKIE_CONSENT_NOTICE_ID = 'gdpr_cookie_consent';

	const VIEWS_TO_SHOW_FEEDBACK      = 3;
	const POSTPONE_OPT_IN_NOTICE_DAYS = 30;

	/**
	 * How long the WPCOM dismissal state stays cached. While stats-admin runs in parallel, both
	 * surfaces read the same WPCOM resource under separate cache keys, so a dismissal through one
	 * can leave the other stale for up to this window — acceptable during the migration.
	 *
	 * @var int
	 */
	const CACHE_TTL = 5 * MINUTE_IN_SECONDS;

	/**
	 * Update notice status.
	 *
	 * @param mixed $id ID of the notice.
	 * @param mixed $status Status of the notice.
	 * @param int   $postponed_for Postponed for how many seconds.
	 * @return array|WP_Error
	 */
	public function update_notice( $id, $status, $postponed_for = 0 ) {
		delete_transient( self::NOTICES_CACHE_KEY );

		return $this->request_as_blog(
			array(
				'timeout' => 5,
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json' ),
			),
			wp_json_encode(
				array(
					'id'            => $id,
					'status'        => $status,
					'postponed_for' => $postponed_for,
				),
				JSON_UNESCAPED_SLASHES
			)
		);
	}

	/**
	 * Return an array of notice IDs as keys and a boolean flagging whether to show them.
	 *
	 * @param bool $bypass_cache Refetch the WPCOM dismissal state instead of using the cached copy.
	 * @return array
	 */
	public function get_notices_to_show( bool $bypass_cache = false ) {
		// Fetch the WPCOM map once and reuse it for every flag, so a force-refresh costs a single
		// round-trip rather than one per shared-key lookup.
		$notices_wpcom = $this->get_notices_from_wpcom( $bypass_cache );

		$new_stats_enabled        = Stats_Options::get_option( 'enable_odyssey_stats' );
		$stats_views              = intval( Stats_Options::get_option( 'views' ) );
		$odyssey_stats_changed_at = intval( Stats_Options::get_option( 'odyssey_stats_changed_at' ) );

		// Check if Jetpack is integrated with the Complianz plugin, which blocks the Stats.
		$complianz_options_integrations  = get_option( 'complianz_options_integrations' );
		$is_jetpack_blocked_by_complianz = ! isset( $complianz_options_integrations['jetpack'] ) || $complianz_options_integrations['jetpack'];

		return array_merge(
			$notices_wpcom,
			array(
				// Show Opt-in notice 30 days after the new stats being disabled.
				self::OPT_IN_NEW_STATS_NOTICE_ID    => ! $new_stats_enabled
					&& $odyssey_stats_changed_at < time() - self::POSTPONE_OPT_IN_NOTICE_DAYS * DAY_IN_SECONDS
					&& ! $this->is_hidden( $notices_wpcom, self::OPT_IN_NEW_STATS_NOTICE_ID ),

				// Show feedback notice after 3 views of the new stats.
				self::NEW_STATS_FEEDBACK_NOTICE_ID  => $new_stats_enabled
					&& $stats_views >= self::VIEWS_TO_SHOW_FEEDBACK
					&& ! $this->is_hidden( $notices_wpcom, self::NEW_STATS_FEEDBACK_NOTICE_ID ),

				// Show opt-out notice before 3 views of the new stats, where 3 is included.
				self::OPT_OUT_NEW_STATS_NOTICE_ID   => $new_stats_enabled
					&& $stats_views < self::VIEWS_TO_SHOW_FEEDBACK
					&& ! $this->is_hidden( $notices_wpcom, self::OPT_OUT_NEW_STATS_NOTICE_ID ),

				// GDPR cookie consent notice for Complianz users.
				self::GDPR_COOKIE_CONSENT_NOTICE_ID => class_exists( 'COMPLIANZ' ) && $is_jetpack_blocked_by_complianz
					&& ! $this->is_hidden( $notices_wpcom, self::GDPR_COOKIE_CONSENT_NOTICE_ID ),
			)
		);
	}

	/**
	 * Get the array of notice dismissal flags stored on WPCOM, cached for {@see CACHE_TTL}.
	 *
	 * @param bool $bypass_cache Refetch instead of returning the cached copy.
	 * @return array
	 */
	public function get_notices_from_wpcom( bool $bypass_cache = false ) {
		if ( ! $bypass_cache ) {
			$cached = get_transient( self::NOTICES_CACHE_KEY );
			if ( false !== $cached ) {
				$decoded = json_decode( $cached, true );
				return is_array( $decoded ) ? $decoded : array();
			}
		}

		$notices_wpcom = $this->request_as_blog( array( 'timeout' => 5 ) );
		if ( is_wp_error( $notices_wpcom ) ) {
			return array();
		}

		set_transient( self::NOTICES_CACHE_KEY, wp_json_encode( $notices_wpcom, JSON_UNESCAPED_SLASHES ), self::CACHE_TTL );

		return $notices_wpcom;
	}

	/**
	 * Checks if a notice is hidden, fetching the WPCOM dismissal state.
	 *
	 * @param mixed $id ID of the notice.
	 * @return bool
	 */
	public function is_notice_hidden( $id ) {
		return $this->is_hidden( $this->get_notices_from_wpcom(), $id );
	}

	/**
	 * Whether a notice is hidden in an already-fetched WPCOM dismissal map.
	 *
	 * @param array $notices_wpcom The WPCOM dismissal map.
	 * @param mixed $id            ID of the notice.
	 * @return bool
	 */
	private function is_hidden( array $notices_wpcom, $id ) {
		return array_key_exists( $id, $notices_wpcom ) && $notices_wpcom[ $id ] === false;
	}

	/**
	 * Send a blog-token request to the WPCOM notices endpoint and return its decoded body.
	 *
	 * @param array       $args Request arguments passed to the connection client.
	 * @param string|null $body Request body, for writes.
	 * @return array|WP_Error Decoded response body, or a WP_Error on transport or API error.
	 */
	private function request_as_blog( array $args, $body = null ) {
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/jetpack-stats-dashboard/notices', Jetpack_Options::get_option( 'id' ) ),
			'v2',
			$args,
			$body,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code = (int) wp_remote_retrieve_response_code( $response );
		$decoded       = json_decode( wp_remote_retrieve_body( $response ), true );

		$error_code = null;
		foreach ( array( 'code', 'error' ) as $key ) {
			if ( isset( $decoded[ $key ] ) ) {
				$error_code = $decoded[ $key ];
				break;
			}
		}

		if ( null !== $error_code || 200 !== $response_code ) {
			// Fall back to a non-empty code so WP_Error keeps the status/message instead of
			// constructing an empty error (WP_Error::__construct bails on an empty code).
			return new WP_Error(
				$error_code ?? 'notices_request_failed',
				is_array( $decoded ) ? ( $decoded['message'] ?? 'unknown remote error' ) : 'unknown remote error',
				array( 'status' => $response_code )
			);
		}

		// The notices endpoint always returns a JSON object; coerce anything else to an empty map.
		return is_array( $decoded ) ? $decoded : array();
	}
}
