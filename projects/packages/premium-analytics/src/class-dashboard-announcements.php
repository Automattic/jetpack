<?php
/**
 * The announcements the dashboard publishes on the What's new surface it hosts.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use function Automattic\Jetpack\Announcements\register_announcement;

/**
 * Registers the dashboard's announcements with the Jetpack Announcements package.
 */
class Dashboard_Announcements {

	/**
	 * Channel every page of the dashboard subscribes to, alone and followed by `/` and its section.
	 *
	 * @see docs/whats-new-channels.md
	 */
	const CHANNEL = 'stats';

	/**
	 * Hook the registrant of the dashboard's announcements.
	 *
	 * @return void
	 */
	public static function configure() {
		add_action( 'jetpack_register_announcements', array( __CLASS__, 'register' ) );
	}

	/**
	 * Register the dashboard's announcements.
	 *
	 * @return void
	 */
	public static function register() {
		// Another plugin may load an older copy of the package first.
		if ( ! function_exists( 'Automattic\\Jetpack\\Announcements\\register_announcement' ) ) {
			return;
		}

		// The dashboard's own rules: what shipped before a user arrived is no news to them,
		// and its news is for whoever can read the dashboard.
		foreach ( static::get_announcements() as $id => $announcement ) {
			if ( ! self::predates_current_user( $announcement['date'] ) ) {
				register_announcement( $id, $announcement + array( 'capability' => Capabilities::VIEW_ANALYTICS ) );
			}
		}
	}

	/**
	 * The announcements of the dashboard, as `$id => $args` pairs.
	 *
	 * @see docs/whats-new-channels.md
	 *
	 * @return array[]
	 */
	protected static function get_announcements() {
		return array();
	}

	/**
	 * Whether a date is older than the current user's registration.
	 *
	 * @param string $date Date of an announcement.
	 * @return bool
	 */
	private static function predates_current_user( $date ) {
		$registered = strtotime( wp_get_current_user()->user_registered . ' +0000' );

		return false !== $registered && strtotime( $date . ' +0000' ) < $registered;
	}
}
