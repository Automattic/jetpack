<?php
/**
 * A class that handles the notices for the Stats Admin dashboard.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats\Options as Stats_Options;
use Jetpack_Options;

/**
 * The Notices class handles the notices for the Stats Admin dashboard.
 *
 * @package Automattic\Jetpack\Stats_Admin
 */
class Notices {
	const STATS_DASHBOARD_NOTICES_CACHE_KEY = 'jetpack_stats_dashboard_notices_cache_key';

	/**
	 * The flat map and the detail records are different shapes of the same resource, so they
	 * cannot share a transient.
	 */
	const STATS_DASHBOARD_NOTICES_DETAILS_CACHE_KEY = self::STATS_DASHBOARD_NOTICES_CACHE_KEY . '_details';

	const OPT_OUT_NEW_STATS_NOTICE_ID   = 'opt_out_new_stats';
	const NEW_STATS_FEEDBACK_NOTICE_ID  = 'new_stats_feedback';
	const OPT_IN_NEW_STATS_NOTICE_ID    = 'opt_in_new_stats';
	const GDPR_COOKIE_CONSENT_NOTICE_ID = 'gdpr_cookie_consent';

	const VIEWS_TO_SHOW_FEEDBACK      = 3;
	const POSTPONE_OPT_IN_NOTICE_DAYS = 30;

	/**
	 * Update notice status.
	 *
	 * @param mixed $id ID of the notice.
	 * @param mixed $status Status of the notice.
	 * @param int   $postponed_for Postponed for how many seconds.
	 * @return bool
	 */
	public function update_notice( $id, $status, $postponed_for = 0 ) {
		delete_transient( self::STATS_DASHBOARD_NOTICES_CACHE_KEY );
		delete_transient( self::STATS_DASHBOARD_NOTICES_DETAILS_CACHE_KEY );
		return WPCOM_Client::request_as_blog(
			sprintf(
				'/sites/%d/jetpack-stats-dashboard/notices',
				Jetpack_Options::get_option( 'id' )
			),
			'v2',
			array(
				'timeout' => 5,
				'method'  => 'POST',
				'headers' => array(
					'Content-Type' => 'application/json',
				),
			),
			wp_json_encode(
				array(
					'id'            => $id,
					'status'        => $status,
					'postponed_for' => $postponed_for,
				),
				JSON_UNESCAPED_SLASHES
			),
			'wpcom'
		);
	}

	/**
	 * Return an array of notices IDs as keys and their value to flag whether to show them.
	 *
	 * @param bool $include_details Return a detail record per notice instead of a bare flag.
	 * @return array
	 */
	public function get_notices_to_show( bool $include_details = false ) {
		// Reuse the one fetch for every flag below, so details mode doesn't also pull the flat map.
		$notices_wpcom = $this->get_notices_from_wpcom( $include_details );

		$new_stats_enabled        = Stats_Options::get_option( 'enable_odyssey_stats' );
		$stats_views              = intval( Stats_Options::get_option( 'views' ) );
		$odyssey_stats_changed_at = intval( Stats_Options::get_option( 'odyssey_stats_changed_at' ) );

		// Check if Jetpack is integrated with the Complianz plugin, which blocks the Stats.
		$complianz_options_integrations  = get_option( 'complianz_options_integrations' );
		$is_jetpack_blocked_by_complianz = ! isset( $complianz_options_integrations['jetpack'] ) || $complianz_options_integrations['jetpack'];

		$local_notices = array(
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
		);

		if ( $include_details ) {
			return $this->to_detail_records( $notices_wpcom, $local_notices );
		}

		return array_merge( $notices_wpcom, $local_notices );
	}

	/**
	 * Normalize every notice to the detail shape, whichever shape WPCOM answered in.
	 *
	 * The package ships to self-hosted sites and can run for months against a WPCOM that does not
	 * serve `include_details` yet, so a passed-through flat value would leave the caller parsing
	 * two shapes in one response.
	 *
	 * @param array $notices_wpcom The WPCOM response, flat map or detail records.
	 * @param array $local_notices The locally-computed visibility flags.
	 * @return array
	 */
	private function to_detail_records( array $notices_wpcom, array $local_notices ) {
		$notices = array();

		foreach ( array_keys( array_merge( $notices_wpcom, $local_notices ) ) as $id ) {
			// A local notice keeps its own visibility; its escalation fields still come from WPCOM.
			$show = array_key_exists( $id, $local_notices )
				? (bool) $local_notices[ $id ]
				: ! $this->is_hidden( $notices_wpcom, $id );

			$notices[ $id ] = $this->to_detail_record( $notices_wpcom[ $id ] ?? null, $show );
		}

		return $notices;
	}

	/**
	 * Get the array of hidden notices from WPCOM.
	 *
	 * @param bool $include_details Ask WPCOM for detail records instead of a flat map.
	 * @return array
	 */
	public function get_notices_from_wpcom( bool $include_details = false ) {
		$path = sprintf(
			'/sites/%d/jetpack-stats-dashboard/notices',
			Jetpack_Options::get_option( 'id' )
		);

		if ( $include_details ) {
			$path .= '?include_details=true';
		}

		$notices_wpcom = WPCOM_Client::request_as_blog_cached(
			$path,
			'v2',
			array(
				'timeout' => 5,
			),
			null,
			'wpcom',
			true,
			$include_details
				? static::STATS_DASHBOARD_NOTICES_DETAILS_CACHE_KEY
				: static::STATS_DASHBOARD_NOTICES_CACHE_KEY
		);

		if ( is_wp_error( $notices_wpcom ) ) {
			return array();
		}
		return $notices_wpcom;
	}

	/**
	 * Checks if a notice is hidden.
	 *
	 * @param mixed $id ID of the notice.
	 * @return bool
	 */
	public function is_notice_hidden( $id ) {
		return $this->is_hidden( $this->get_notices_from_wpcom(), $id );
	}

	/**
	 * Whether a notice is hidden in an already-fetched WPCOM response, in either shape.
	 *
	 * @param array $notices_wpcom The WPCOM response, flat map or detail records.
	 * @param mixed $id            ID of the notice.
	 * @return bool
	 */
	private function is_hidden( array $notices_wpcom, $id ) {
		if ( ! array_key_exists( $id, $notices_wpcom ) ) {
			return false;
		}

		$record = $notices_wpcom[ $id ];

		return is_array( $record ) ? empty( $record['show'] ) : $record === false;
	}

	/**
	 * Wrap a locally-computed flag in the detail shape, filling the escalation fields from WPCOM.
	 *
	 * @param mixed $wpcom_record The WPCOM detail record for this notice, or null when it has none.
	 * @param bool  $show         The locally-computed visibility flag.
	 * @return array
	 */
	private function to_detail_record( $wpcom_record, bool $show ) {
		$record = is_array( $wpcom_record ) ? $wpcom_record : array();

		return array(
			'show'            => $show,
			'status'          => $record['status'] ?? null,
			'postponed_count' => (int) ( $record['postponed_count'] ?? 0 ),
			// A non-numeric value would cast to 0, which reads as "due now" rather than "not scheduled".
			'next_show_at'    => is_numeric( $record['next_show_at'] ?? null ) ? (int) $record['next_show_at'] : null,
		);
	}
}
