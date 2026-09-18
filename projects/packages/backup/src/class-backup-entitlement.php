<?php
/**
 * Caches whether WordPress.com says this site is entitled to Backup.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\My_Jetpack\Product as My_Jetpack_Product;
use WP_Error;
use function add_action;
use function esc_html__;
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
class Backup_Entitlement {

	/**
	 * Option holding the last answer WordPress.com gave.
	 *
	 * Deliberately unversioned, unlike the namespace: two active plugins carrying
	 * different versions of this package must share one entitlement, not two.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_backup_entitlement';

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
	 * Whether the site is entitled to Backup, answering an unread site as not entitled.
	 *
	 * Serves the stored answer and refreshes after the response, so no admin page
	 * load ever waits on WordPress.com to decide whether to draw a menu item.
	 *
	 * @return bool
	 */
	public static function has_backup() {
		$local_answer = self::local_feature_answer();

		if ( $local_answer !== null ) {
			return $local_answer;
		}

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
	 * page calls to pick up a just-bought plan on the checkout's own return.
	 *
	 * @return bool|WP_Error True when the site has Backup, or a WP_Error if WordPress.com could not be read.
	 */
	public static function refresh() {
		$local_answer = self::local_feature_answer();

		if ( $local_answer !== null ) {
			return $local_answer;
		}

		$features = self::read_site_features();

		if ( $features === null ) {
			// Recorded even though nothing was answered, which is what makes the backoff work.
			self::store( self::get_stored(), null );

			return new WP_Error(
				'site_features_unreadable',
				esc_html__( 'Unable to read the backup plan details for this site.', 'jetpack-backup-pkg' ),
				array( 'status' => 500 )
			);
		}

		$has_backup = self::features_grant_backup( $features );

		self::record( $has_backup );

		return $has_backup;
	}

	/**
	 * Refreshes only if the stored answer still wants it, which the queued path does not know.
	 *
	 * Something else — most often the My Jetpack listener below — can answer between the
	 * moment a refresh is queued and the moment it runs.
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
	 * Store the entitlement My Jetpack has just read from WordPress.com.
	 *
	 * My Jetpack reads the same feature list this cache refreshes from, so a read it
	 * has already made is the answer — not a hint to go and make a second one.
	 *
	 * @param array $features Site features, with 'active' and 'available' keys.
	 * @return void
	 */
	public static function store_from_site_features( $features ) {
		// A host that answers from the plan itself keeps nothing here to store.
		if ( self::local_feature_answer() !== null ) {
			return;
		}

		if ( ! is_array( $features ) || ! isset( $features['active'] ) || ! is_array( $features['active'] ) ) {
			return;
		}

		self::record( self::features_grant_backup( $features ) );
	}

	/**
	 * Stores an answer, skipping the write when the stored one already says the same thing.
	 *
	 * My Jetpack reads its feature list on most page loads, and `refresh()` reaches
	 * WordPress.com through that same read — so one answer would otherwise be written
	 * two or three times a request.
	 *
	 * @param bool $has_backup Whether the site is entitled to Backup.
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
	 * The site's feature list, or null when WordPress.com could not be read.
	 *
	 * Goes through My Jetpack so both read one list — and so a site that has just
	 * rendered My Jetpack is answered from its cache instead of over the network.
	 *
	 * @return array|null
	 */
	private static function read_site_features() {
		if ( ! class_exists( My_Jetpack_Product::class ) || ! method_exists( My_Jetpack_Product::class, 'get_site_features_from_wpcom' ) ) {
			return null;
		}

		$features = My_Jetpack_Product::get_site_features_from_wpcom();

		return is_wp_error( $features ) ? null : $features;
	}

	/**
	 * Whether a feature list includes Backup.
	 *
	 * @param array $features Site features, with 'active' and 'available' keys.
	 * @return bool
	 */
	private static function features_grant_backup( $features ) {
		return isset( $features['active'] )
			&& is_array( $features['active'] )
			&& in_array( self::SITE_FEATURE, $features['active'], true );
	}

	/**
	 * WordPress.com's own answer for this site, or null on a host that cannot give one.
	 *
	 * On WoA the plan feature is readable in-process, so the question is settled without any
	 * request. It is also what jetpack-mu-wpcom's Backup page reads to decide whether to leave
	 * the `jetpack-backup` slug to this plugin, so reading the same signal is what keeps exactly
	 * one of the two owning that page — an answer that disagreed would leave it owned by neither.
	 *
	 * @return bool|null
	 */
	private static function local_feature_answer() {
		if ( ! Constants::is_true( 'IS_ATOMIC' ) ) {
			return null;
		}

		if ( ! function_exists( 'wpcom_site_has_feature' ) || ! defined( '\WPCOM_Features::BACKUPS_SELF_SERVE' ) ) {
			return null;
		}

		// Called without a blog ID: a WoA site would pass its local one, which is not the
		// WordPress.com blog ID. wpcom resolves the current site itself.
		// SELF_SERVE rather than BACKUPS: it is the one that means "manages its own backups",
		// and the two differ only for wpcom plans below Business, which WoA never runs.
		return (bool) wpcom_site_has_feature( \WPCOM_Features::BACKUPS_SELF_SERVE );
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
	 * Refreshes at the end of the request, backing off so a failing read is not retried every page load.
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

		if ( has_action( 'shutdown', array( __CLASS__, 'refresh_if_stale' ) ) !== false ) {
			return;
		}

		add_action( 'shutdown', array( __CLASS__, 'refresh_if_stale' ) );
	}
}
