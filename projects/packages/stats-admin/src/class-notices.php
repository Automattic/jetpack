<?php
/**
 * A class that handles the notices for the Stats Admin dashboard.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats\Options as Stats_Options;

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

	const VIEWS_TO_SHOW_FEEDBACK = 3;
	const POSTPONE_FEEDBACK_DAYS = 30;

	/**
	 * Update the notice status.
	 *
	 * @param mixed $id ID of the notice.
	 * @param mixed $status Status of the notice.
	 * @return bool
	 */
	public function update_notice( $id, $status ) {
		$notices        = Stats_Options::get_option( 'notices' );
		$notices[ $id ] = array(
			'status'       => $status,
			'id'           => $id,
			'dismissed_at' => time(),
			'next_show_at' => $status === self::NOTICE_STATUS_POSTPONED ? time() + self::POSTPONE_FEEDBACK_DAYS * DAY_IN_SECONDS : PHP_INT_MAX,
		);
		return Stats_Options::set_option( 'notices', $notices );
	}

	/**
	 * For now, we support only one notice at a time.
	 *
	 * @return array
	 */
	public function get_notices_to_show() {
		$new_stats_enabled = Stats_Options::get_option( 'enable_odyssey_stats' );

		if ( ! $new_stats_enabled && ! $this->is_notice_hidden( self::OPT_IN_NEW_STATS_NOTICE_ID ) ) {
			return array( self::OPT_IN_NEW_STATS_NOTICE_ID => true );
		}

		// Views > 3 and not dismissed, we show the feedback notice.
		if ( $this->get_new_stats_views() >= self::VIEWS_TO_SHOW_FEEDBACK && ! $this->is_notice_hidden( self::NEW_STATS_FEEDBACK_NOTICE_ID ) ) {
			return array(
				self::NEW_STATS_FEEDBACK_NOTICE_ID => true,
			);
		}

		// If opt-out notice is not dismissed, we show it.
		if ( ! $this->is_notice_hidden( self::OPT_OUT_NEW_STATS_NOTICE_ID ) ) {
			return array(
				self::OPT_OUT_NEW_STATS_NOTICE_ID => true,
			);
		}
		return array();
	}

	/**
	 * Returns the array of hidden notice IDs.
	 *
	 * @return array Array of hidden notice IDs.
	 */
	public function get_hidden_notices() {
		static $hidden_notice_ids;
		$notices = Stats_Options::get_option( 'notices' );

		$hidden_notice_ids = array_filter(
			$notices,
			function ( $notice ) {
				if ( ! isset( $notice['status'] ) ) {
					return false;
				}
				switch ( $notice['status'] ) {
					case 'dismissed':
						return true;
					case 'postponed':
						return $notice['next_show_at'] > time();
					default:
						return false;
				}
			},
			ARRAY_FILTER_USE_BOTH
		);

		return $hidden_notice_ids;
	}

	/**
	 * Checks if a notice is hidden.
	 *
	 * @param mixed $id ID of the notice.
	 * @return bool
	 */
	public function is_notice_hidden( $id ) {
		return array_key_exists( $id, $this->get_hidden_notices() );
	}

	/**
	 * Returns the number of views of the new stats dashboard.
	 */
	public function get_new_stats_views() {
		return Stats_Options::get_option( 'views' );
	}
}
