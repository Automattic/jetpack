<?php
/**
 * Remembers whether the site's plan includes Backup.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\My_Jetpack\Product as My_Jetpack_Product;
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
 * Storage for My Jetpack's Backup feature check, so admin menus can read it without a request.
 *
 * My Jetpack answers the question and caches it for fifteen seconds, which is enough for one
 * page render and not enough for someone clicking around wp-admin. This keeps the last answer
 * in an option and refreshes it after the response.
 */
class Backup_Feature_Check {

	/**
	 * Option holding the last answer My Jetpack gave.
	 *
	 * Deliberately unversioned, unlike the namespace: two active plugins carrying
	 * different versions of this package must share one answer, not two.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_backup_feature_check';

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
	 * Matches `My_Jetpack\Products\Backup::$feature_identifying_paid_plan`, which is what
	 * My Jetpack's own Backup card reads — so the card and this menu cannot disagree.
	 *
	 * @var string
	 */
	const SITE_FEATURE = 'backups';

	/**
	 * Whether the site's plan includes Backup, answering an unread site as no.
	 *
	 * Serves the stored answer and refreshes after the response, so no admin page
	 * load ever waits on WordPress.com to decide whether to draw a menu item.
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
	 * Asks My Jetpack again and stores what it says.
	 *
	 * Also the `my_jetpack_site_features_updated` listener: that action fires once My Jetpack
	 * has read and cached the feature list, so the read below is answered without a request.
	 *
	 * @return void
	 */
	public static function refresh() {
		$has_backup = self::read_feature();

		if ( $has_backup === null ) {
			// Recorded even though nothing was answered, which is what makes the backoff work.
			self::store( self::get_stored(), null );

			return;
		}

		self::record( $has_backup );
	}

	/**
	 * Refreshes only if the stored answer still wants it, which the queued path does not know.
	 *
	 * Something else — most often the listener above — can answer between the moment a
	 * refresh is queued and the moment it runs.
	 *
	 * @return void
	 */
	public static function refresh_if_stale() {
		$stored = self::get_stored();

		if ( $stored !== null && ! self::is_stale( $stored ) ) {
			return;
		}

		self::refresh();
	}

	/**
	 * My Jetpack's answer, or null when WordPress.com could not be read.
	 *
	 * The feature check itself reports an unreadable site as "no feature", which is the safe
	 * default for an upsell but not for a menu — here it has to stay distinct from a real no,
	 * so the underlying read is checked for the error first. It is cached by then, not repeated.
	 *
	 * @return bool|null
	 */
	private static function read_feature() {
		if ( ! class_exists( My_Jetpack_Product::class ) || ! method_exists( My_Jetpack_Product::class, 'does_site_have_feature' ) ) {
			return null;
		}

		if ( is_wp_error( My_Jetpack_Product::get_site_features_from_wpcom() ) ) {
			return null;
		}

		return My_Jetpack_Product::does_site_have_feature( self::SITE_FEATURE );
	}

	/**
	 * Stores an answer, skipping the write when the stored one already says the same thing.
	 *
	 * My Jetpack reads its feature list on most page loads, and every read fires the listener
	 * above — so one answer would otherwise be rewritten several times a request.
	 *
	 * @param bool $has_backup Whether the site's plan includes Backup.
	 * @return void
	 */
	private static function record( $has_backup ) {
		$stored = self::get_stored();

		if ( $stored !== null && (bool) $stored['has_backup'] === $has_backup && ! self::is_stale( $stored ) ) {
			return;
		}

		self::store( $stored, $has_backup );
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
	 * A read that failed is not an answer. Keeping the previous one is what stops a
	 * WordPress.com blip from taking the menu item away mid-session.
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
	 * Refreshes at the end of the request, backing off so a failing read is not retried every page load.
	 *
	 * Deliberately not WP-Cron: a site with `DISABLE_WP_CRON`, a blocked loopback
	 * request, or a cleared queue would never run the event, and an answer that is
	 * never read for the first time is a menu item that never appears.
	 *
	 * @param array|null $stored The stored entry, if any.
	 * @return void
	 */
	private static function queue_refresh( $stored ) {
		if ( $stored !== null && ( time() - $stored['attempted_at'] ) < self::RETRY_INTERVAL ) {
			return;
		}

		if ( has_action( 'shutdown', array( __CLASS__, 'refresh_if_stale' ) ) !== false ) {
			return;
		}

		add_action( 'shutdown', array( __CLASS__, 'refresh_if_stale' ) );
	}
}
