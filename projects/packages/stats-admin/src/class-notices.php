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
	const OPT_OUT_NEW_STATS_NOTICE_ID  = 'opt_out_new_stats';
	const NEW_STATS_FEEDBACK_NOTICE_ID = 'new_stats_feedback';
	const OPT_IN_NEW_STATS_NOTICE_ID   = 'opt_in_new_stats';

	const NOTICE_STATUS_DISMISSED = 'dismissed';
	const NOTICE_STATUS_POSTPONED = 'postponed';

	const VIEWS_TO_SHOW_FEEDBACK      = 3;
	const POSTPONE_FEEDBACK_DAYS      = 30;
	const POSTPONE_OPT_IN_NOTICE_DAYS = 30;

	/**
	 * Return an array of notices IDs as keys and their value to flag whther to show them.
	 *
	 * @return array
	 */
	public function get_notices_to_show() {
		$notices_wpcom = $this->get_notices_from_wpcom();

		$new_stats_enabled        = Stats_Options::get_option( 'enable_odyssey_stats' );
		$stats_views              = intval( Stats_Options::get_option( 'views' ) );
		$odyssey_stats_changed_at = intval( Stats_Options::get_option( 'odyssey_stats_changed_at' ) );

		return array_merge(
			$notices_wpcom,
			array(
				// Show Opt-in notice 30 days after the new stats being disabled.
				self::OPT_IN_NEW_STATS_NOTICE_ID   => ! $new_stats_enabled
					&& $odyssey_stats_changed_at < time() - self::POSTPONE_OPT_IN_NOTICE_DAYS * DAY_IN_SECONDS
					&& ! $this->is_notice_hidden( self::OPT_IN_NEW_STATS_NOTICE_ID ),

				// Show feedback notice after 3 views of the new stats.
				self::NEW_STATS_FEEDBACK_NOTICE_ID => $new_stats_enabled
					&& $stats_views >= self::VIEWS_TO_SHOW_FEEDBACK
					&& ! $this->is_notice_hidden( self::NEW_STATS_FEEDBACK_NOTICE_ID ),

				// Show opt-out notice before 3 views of the new stats, where 3 is included.
				self::OPT_OUT_NEW_STATS_NOTICE_ID  => $new_stats_enabled
					&& $stats_views < self::VIEWS_TO_SHOW_FEEDBACK
					&& ! $this->is_notice_hidden( self::OPT_OUT_NEW_STATS_NOTICE_ID ),
			)
		);
	}

	/**
	 * Get the array of hidden notices from WPCOM.
	 */
	public function get_notices_from_wpcom() {
		$notices_wpcom = WPCOM_Client::request_as_blog_cached(
			sprintf(
				'/sites/%d/jetpack-stats-dashboard/notices',
				Jetpack_Options::get_option( 'id' )
			),
			'v2',
			array(
				'timeout' => 5,
			),
			null,
			'wpcom'
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
		return array_key_exists( $id, $this->get_notices_from_wpcom() );
	}
}
