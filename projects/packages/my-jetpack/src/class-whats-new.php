<?php
/**
 * What My Jetpack publishes on the What's new surface it hosts.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use function Automattic\Jetpack\Announcements\get_announcements_from_feed;
use function Automattic\Jetpack\Announcements\register_announcement;

/**
 * Publishes the recent posts of Jetpack.com as announcements of My Jetpack.
 */
class Whats_New {

	/**
	 * Channel the My Jetpack page subscribes to, and the first half of the ids My Jetpack registers.
	 */
	const CHANNEL = 'my-jetpack';

	/**
	 * How old a post may be to count as news, in seconds.
	 */
	const MAX_AGE = 30 * DAY_IN_SECONDS;

	/**
	 * Hook the registrant.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'jetpack_register_announcements', array( __CLASS__, 'register' ) );
	}

	/**
	 * Register the recent posts of Jetpack.com, while the flag is on.
	 *
	 * @return void
	 */
	public static function register() {
		if ( ! Initializer::is_whats_new_enabled() ) {
			return;
		}

		// Another plugin may load an older copy of the package first.
		if ( ! function_exists( 'Automattic\\Jetpack\\Announcements\\get_announcements_from_feed' ) ) {
			return;
		}

		$announcements = get_announcements_from_feed( REST_Blog_Posts::FEED_URL, self::CHANNEL, array( 'max_age' => self::MAX_AGE ) );

		foreach ( $announcements as $announcement ) {
			register_announcement( $announcement['id'], $announcement['args'] + array( 'channels' => array( self::CHANNEL ) ) );
		}
	}
}
