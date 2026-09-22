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
	 * Option holding the last answer My Jetpack gave, and when it goes stale.
	 *
	 * Deliberately unversioned, unlike the namespace: two active plugins carrying
	 * different versions of this package must share one answer, not two.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_backup_feature_check';

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
	 * Not the broader `backups`: this page manages and restores backups itself, which is what
	 * self-serve grants — and it is what jetpack-mu-wpcom's Backup page reads to step aside.
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
			// Re-adding the same static callback replaces it rather than stacking a
			// second one, so this needs no guard of its own.
			add_action( 'shutdown', array( __CLASS__, 'refresh_if_stale' ) );
		}

		return $stored !== null && $stored['has_backup'];
	}

	/**
	 * Asks My Jetpack and stores what it says.
	 *
	 * Also the `my_jetpack_site_features_updated` listener, which fires just after the feature
	 * list is cached — so the read below costs no request. Takes no argument on purpose: the
	 * action passes one, and a parameter here would silently collect it.
	 *
	 * @return void
	 */
	public static function refresh() {
		self::store( self::read_feature() );
	}

	/**
	 * Asks again with My Jetpack's short-lived cache dropped first.
	 *
	 * For the page-open read: the My Jetpack render that sent the user to checkout may have
	 * cached the features seconds ago, and that copy still describes the pre-purchase plan.
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
	 * Costs one WordPress.com read per site, not per page: `store()` writes even for a read
	 * that failed, so a site that has been asked once is never asked here again.
	 *
	 * @return void
	 */
	public static function refresh_if_never_answered() {
		if ( self::get_stored() === null ) {
			self::refresh();
		}
	}

	/**
	 * The queued refresh, which asks only if the answer is still stale.
	 *
	 * Something else — the listener above, or the Backup page — can answer between the
	 * moment a refresh is queued and the moment it runs.
	 *
	 * @return void
	 */
	public static function refresh_if_stale() {
		if ( self::is_stale( self::get_stored() ) ) {
			self::refresh();
		}
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

		// A site with no blog token has no plan here to read, so this is a settled no rather
		// than a failed read — without it a disconnected site keeps the menu indefinitely.
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
	 * One clock covers both waits: `store()` sets it a full TTL out for an answer and a
	 * short retry out for a failure, so there is no second condition to keep in step.
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
	 * Writes the answer, or carries the last one forward when the read produced none.
	 *
	 * A read that failed is not an answer. Keeping the previous one is what stops a
	 * WordPress.com blip from taking the menu item away mid-session; it is asked again
	 * after the short retry rather than the full TTL.
	 *
	 * @param bool|null $has_backup The answer, or null when the read failed.
	 * @return void
	 */
	private static function store( $has_backup ) {
		$stored = self::get_stored();
		$failed = $has_backup === null;
		$answer = $failed ? ( $stored !== null && $stored['has_backup'] ) : $has_backup;

		// My Jetpack reads its feature list on most page loads and every read lands here, so
		// an unchanged answer that is still fresh must not restamp the option each time.
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
