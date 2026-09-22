<?php
/**
 * Remembers whether the site's plan includes Backup.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\My_Jetpack\Product as My_Jetpack_Product;
use function add_action;
use function get_option;
use function get_transient;
use function is_wp_error;
use function set_transient;
use function time;
use function update_option;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Keeps My Jetpack's Backup feature check in an option, so admin menus can read it without a request.
 *
 * My Jetpack only caches the answer for fifteen seconds; this refreshes it after the response.
 */
class Backup_Feature_Check {

	/**
	 * Option holding the last answer My Jetpack gave, and when it goes stale.
	 *
	 * Deliberately unversioned, unlike the namespace: two active plugins carrying
	 * different versions of this package must share one answer, not two.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_backup_feature_check';

	/**
	 * Transient held while one request is reading, so concurrent ones do not read too.
	 *
	 * @var string
	 */
	const LOCK = 'jetpack_backup_feature_check_lock';

	/**
	 * How long an answer is served before it is refreshed.
	 *
	 * @var int
	 */
	const TTL = HOUR_IN_SECONDS;

	/**
	 * How long to wait before asking again after a read that answered nothing.
	 *
	 * @var int
	 */
	const RETRY_INTERVAL = 5 * MINUTE_IN_SECONDS;

	/**
	 * WordPress.com's name for the entitlement this dashboard needs.
	 *
	 * Not the broader `backups`: this page manages and restores backups itself.
	 *
	 * @var string
	 */
	const SITE_FEATURE = 'backups-self-serve';

	/**
	 * Whether the site's plan includes Backup, answering an unread site as no.
	 *
	 * Serves the stored answer and queues the refresh for after the response, so
	 * drawing a menu item does not itself wait on WordPress.com.
	 *
	 * @return bool
	 */
	public static function has_backup() {
		$stored = self::get_stored();

		if ( self::is_stale( $stored ) ) {
			// Runs last because it closes the connection, and re-adding the same static
			// callback replaces it rather than stacking a second one.
			add_action( 'shutdown', array( __CLASS__, 'refresh_if_stale' ), PHP_INT_MAX );
		}

		return $stored !== null && $stored['has_backup'];
	}

	/**
	 * Asks My Jetpack and stores what it says.
	 *
	 * Also the `my_jetpack_site_features_updated` listener, which fires once the features are
	 * cached, so it costs no request there. It ignores the action's argument on purpose.
	 *
	 * @return void
	 */
	public static function refresh() {
		self::store( self::read_feature() );
	}

	/**
	 * Asks again with My Jetpack's cache dropped first.
	 *
	 * For the page-open read, where that cache may still describe the pre-purchase plan.
	 *
	 * @return void
	 */
	public static function refresh_from_wpcom() {
		if ( method_exists( My_Jetpack_Product::class, 'reset_site_features_cache' ) ) {
			My_Jetpack_Product::reset_site_features_cache();
		}

		self::refresh();
	}

	/**
	 * The first answer for a site that has never had one, in time for this request's menu.
	 *
	 * One read per site, not per page: `store()` writes even when the read failed.
	 *
	 * @return void
	 */
	public static function refresh_if_never_answered() {
		if ( self::get_stored() === null ) {
			self::refresh();
		}
	}

	/**
	 * The queued refresh, which asks only if nothing answered since it was queued.
	 *
	 * @return void
	 */
	public static function refresh_if_stale() {
		if ( ! self::is_stale( self::get_stored() ) || ! self::claim_attempt() ) {
			return;
		}

		self::finish_request();
		self::refresh();
	}

	/**
	 * Whether this request is the one that gets to make the read, among concurrent stale ones.
	 *
	 * @return bool
	 */
	private static function claim_attempt() {
		if ( get_transient( self::LOCK ) ) {
			return false;
		}

		set_transient( self::LOCK, 1, self::RETRY_INTERVAL );

		return true;
	}

	/**
	 * Close the connection where the SAPI can, since `shutdown` otherwise keeps the browser waiting.
	 *
	 * @return void
	 */
	private static function finish_request() {
		if ( function_exists( 'fastcgi_finish_request' ) ) {
			fastcgi_finish_request();
		}
	}

	/**
	 * My Jetpack's answer, or null when WordPress.com could not be read.
	 *
	 * The feature check reads a failure as "no feature", so the (cached) read is checked first.
	 *
	 * @return bool|null
	 */
	private static function read_feature() {
		if ( ! class_exists( My_Jetpack_Product::class ) || ! method_exists( My_Jetpack_Product::class, 'does_site_have_feature' ) ) {
			return null;
		}

		// A settled no, not a failed read, or a disconnected site would keep the menu indefinitely.
		if ( ! ( new Connection_Manager() )->is_connected() ) {
			return false;
		}

		if ( is_wp_error( My_Jetpack_Product::get_site_features_from_wpcom() ) ) {
			return null;
		}

		return My_Jetpack_Product::does_site_have_feature( self::SITE_FEATURE );
	}

	/**
	 * Whether the stored answer wants refreshing. Nothing stored is always stale.
	 *
	 * @param array|null $stored The stored entry, if any.
	 * @return bool
	 */
	private static function is_stale( $stored ) {
		return $stored === null || time() >= $stored['stale_after'];
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
			'has_backup'  => (bool) $stored['has_backup'],
			'stale_after' => isset( $stored['stale_after'] ) ? (int) $stored['stale_after'] : 0,
		);
	}

	/**
	 * Writes the answer, or carries the last one forward on the short retry when the read failed.
	 *
	 * @param bool|null $has_backup The answer, or null when the read failed.
	 * @return void
	 */
	private static function store( $has_backup ) {
		$stored = self::get_stored();
		$failed = $has_backup === null;
		$answer = $failed ? ( $stored !== null && $stored['has_backup'] ) : $has_backup;

		// Every My Jetpack read lands here, so a fresh, unchanged answer is not rewritten.
		if ( $stored !== null && $stored['has_backup'] === $answer && ! self::is_stale( $stored ) ) {
			return;
		}

		update_option(
			self::OPTION,
			array(
				'has_backup'  => $answer,
				'stale_after' => time() + ( $failed ? self::RETRY_INTERVAL : self::TTL ),
			),
			false
		);
	}
}
