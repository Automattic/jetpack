<?php
/**
 * Caches whether WordPress.com says this site is entitled to Backup.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use function add_action;
use function get_option;
use function has_action;
use function is_wp_error;
use function time;
use function update_option;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Serves the site's Backup entitlement to admin menus without a WordPress.com round trip.
 */
class Rewind_State_Cache {

	/**
	 * Option holding the last answer WordPress.com gave.
	 *
	 * Deliberately unversioned, unlike the namespace: two active plugins carrying
	 * different versions of this package must share one entitlement, not two.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_backup_rewind_state';

	/**
	 * How long a stored answer is served before a refresh is queued.
	 *
	 * @var int
	 */
	const TTL = HOUR_IN_SECONDS;

	/**
	 * How long to wait before retrying after an attempt.
	 *
	 * @var int
	 */
	const RETRY_INTERVAL = 5 * MINUTE_IN_SECONDS;

	/**
	 * WordPress.com's name for Backup in a site's feature list.
	 *
	 * Matches `My_Jetpack\Products\Backup::$feature_identifying_paid_plan`, which is
	 * what My Jetpack itself reads.
	 *
	 * @var string
	 */
	const SITE_FEATURE = 'backups';

	/**
	 * Whether the site is entitled to Backup, answering an unread site as not entitled.
	 *
	 * Serves the stored answer and refreshes after the response, so no admin page
	 * load ever blocks on WordPress.com to decide whether to draw a menu item.
	 *
	 * @return bool
	 */
	public static function has_backup() {
		$stored = self::get_stored();

		if ( $stored === null || self::is_stale( $stored ) ) {
			self::queue_refresh( $stored );
		}

		return $stored !== null && (bool) $stored['has_backup'];
	}

	/**
	 * Reads the entitlement from WordPress.com and stores a clear answer.
	 *
	 * This is the cache-busting path: it always asks, and is what the Backup admin
	 * page and a post-checkout return call to pick up a just-bought plan.
	 *
	 * @return bool|\WP_Error True when the site has Backup, or a WP_Error if WordPress.com could not be read.
	 */
	public static function refresh() {
		$stored = self::get_stored();

		// Claim the attempt before the read, so a second request arriving while this
		// one is still waiting on WordPress.com backs off instead of asking again.
		self::store( $stored, null );

		$state = Jetpack_Backup::get_backup_plan_state();

		if ( is_wp_error( $state ) ) {
			return $state;
		}

		self::store( $stored, (bool) $state );

		return (bool) $state;
	}

	/**
	 * Re-read the entitlement when My Jetpack has seen Backup on a site we believe has none.
	 *
	 * Optimistic and one-directional: a plan's feature list and the rewind state answer
	 * different questions, so this can prompt a re-read but never revoke on its own.
	 * Acting only on a disagreement also keeps My Jetpack's 15-second cache from
	 * queueing a read every time someone browses that page.
	 *
	 * @param array $features Site features, with 'active' and 'available' keys.
	 * @return void
	 */
	public static function maybe_refresh_from_site_features( $features ) {
		if ( ! is_array( $features ) || empty( $features['active'] ) || ! is_array( $features['active'] ) ) {
			return;
		}

		if ( ! in_array( self::SITE_FEATURE, $features['active'], true ) ) {
			return;
		}

		// Also queues its own refresh when nothing is stored yet, which is the whole job there.
		if ( self::has_backup() ) {
			return;
		}

		self::mark_stale();
		self::queue_refresh( self::get_stored() );
	}

	/**
	 * Drop the answer's freshness without dropping the answer.
	 *
	 * Deleting the entry instead would answer "no Backup" for the rest of the request and
	 * take the menu item away mid-session, which is what the stored answer exists to prevent.
	 *
	 * @return void
	 */
	private static function mark_stale() {
		$stored = self::get_stored();

		if ( $stored === null ) {
			return;
		}

		update_option(
			self::OPTION,
			array(
				'has_backup'   => $stored['has_backup'],
				'checked_at'   => 0,
				'attempted_at' => 0,
			),
			false
		);
	}

	/**
	 * The stored entry, or null when nothing usable is stored yet.
	 *
	 * @return array|null
	 */
	private static function get_stored() {
		$stored = get_option( self::OPTION );

		if ( ! is_array( $stored ) || ! array_key_exists( 'has_backup', $stored ) ) {
			return null;
		}

		return array(
			'has_backup'   => $stored['has_backup'],
			'checked_at'   => isset( $stored['checked_at'] ) ? (int) $stored['checked_at'] : 0,
			'attempted_at' => isset( $stored['attempted_at'] ) ? (int) $stored['attempted_at'] : 0,
		);
	}

	/**
	 * Writes the entry, preserving the last clear answer when this attempt did not produce one.
	 *
	 * A read that failed is not an answer. Keeping the previous entitlement is what
	 * stops a WordPress.com blip from taking the menu item away mid-session.
	 *
	 * @param array|null $stored     The entry being replaced, if any.
	 * @param bool|null  $has_backup The answer, or null when the read failed.
	 * @return void
	 */
	private static function store( $stored, $has_backup ) {
		$now      = time();
		$answered = is_bool( $has_backup );

		update_option(
			self::OPTION,
			array(
				'has_backup'   => $answered ? $has_backup : ( $stored === null ? null : $stored['has_backup'] ),
				'checked_at'   => $answered ? $now : ( $stored === null ? 0 : $stored['checked_at'] ),
				'attempted_at' => $now,
			),
			false
		);
	}

	/**
	 * Whether the stored answer is old enough to want refreshing.
	 *
	 * @param array $stored The stored entry.
	 * @return bool
	 */
	private static function is_stale( array $stored ) {
		return ( time() - $stored['checked_at'] ) >= self::TTL;
	}

	/**
	 * Refreshes after the response, backing off so a failing fetch is not retried every page load.
	 *
	 * Deliberately not WP-Cron: a site with `DISABLE_WP_CRON`, a blocked loopback
	 * request, or a cleared queue would never run the event, and an entitlement
	 * that is never read for the first time is a menu item that never appears.
	 *
	 * @param array|null $stored The stored entry, if any.
	 * @return void
	 */
	private static function queue_refresh( $stored ) {
		if ( $stored !== null && ( time() - $stored['attempted_at'] ) < self::RETRY_INTERVAL ) {
			return;
		}

		if ( has_action( 'shutdown', array( __CLASS__, 'refresh' ) ) !== false ) {
			return;
		}

		add_action( 'shutdown', array( __CLASS__, 'refresh' ) );
	}
}
