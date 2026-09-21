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
	 * Option holding the last answer My Jetpack gave, and when to ask again.
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

		if ( self::is_due( $stored ) ) {
			// Re-adding the same static callback replaces it rather than stacking a
			// second one, so this needs no guard of its own.
			add_action( 'shutdown', array( __CLASS__, 'refresh_if_due' ) );
		}

		return $stored !== null && $stored['has_backup'];
	}

	/**
	 * Asks My Jetpack and stores what it says.
	 *
	 * Also the `my_jetpack_site_features_updated` listener: that action fires once My Jetpack
	 * has read and cached the feature list, so the read below is answered without a request.
	 * Takes no argument on purpose — the action passes one, and a parameter here would
	 * silently collect it.
	 *
	 * @return void
	 */
	public static function refresh() {
		self::store( self::read_feature() );
	}

	/**
	 * The queued refresh, which asks only if the answer is still due.
	 *
	 * Something else — the listener above, or the Backup page — can answer between the
	 * moment a refresh is queued and the moment it runs.
	 *
	 * @return void
	 */
	public static function refresh_if_due() {
		if ( self::is_due( self::get_stored() ) ) {
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

		if ( is_wp_error( My_Jetpack_Product::get_site_features_from_wpcom() ) ) {
			return null;
		}

		return My_Jetpack_Product::does_site_have_feature( self::SITE_FEATURE );
	}

	/**
	 * Whether it is time to ask again. Nothing stored is always due.
	 *
	 * One clock covers both waits: `store()` sets it a full TTL out for an answer and a
	 * short retry out for a failure, so there is no second condition to keep in step.
	 *
	 * @param array|null $stored The stored entry, if any.
	 * @return bool
	 */
	private static function is_due( $stored ) {
		return $stored === null || time() >= $stored['refresh_after'];
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
			'has_backup'    => (bool) $stored['has_backup'],
			'refresh_after' => isset( $stored['refresh_after'] ) ? (int) $stored['refresh_after'] : 0,
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
		// an unchanged answer that is not due yet must not restamp the option each time.
		if ( $stored !== null && $stored['has_backup'] === $answer && ! self::is_due( $stored ) ) {
			return;
		}

		update_option(
			self::OPTION,
			array(
				'has_backup'    => $answer,
				'refresh_after' => time() + ( $failed ? self::RETRY_INTERVAL : self::TTL ),
			),
			false
		);
	}
}
