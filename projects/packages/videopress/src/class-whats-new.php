<?php
/**
 * What VideoPress publishes on the What's new surface it hosts.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use function Automattic\Jetpack\Announcements\get_announcements_from_feed;
use function Automattic\Jetpack\Announcements\register_announcement;

/**
 * Publishes the posts of Jetpack.com about VideoPress as announcements of VideoPress.
 */
class Whats_New {

	/**
	 * Flag that turns What's new on, in every Jetpack product that shows it. My Jetpack registers it here.
	 */
	const FLAG = 'jetpack-whats-new';

	/**
	 * Channel the VideoPress pages subscribe to, and the first half of the ids VideoPress registers.
	 */
	const CHANNEL = 'videopress';

	/**
	 * The feed the announcements come from.
	 */
	const FEED_URL = 'https://jetpack.com/feed/';

	/**
	 * Label a post of that feed carries when it is about VideoPress.
	 */
	const LABEL = 'VideoPress';

	/**
	 * How old a post may be to count as news, in seconds.
	 */
	const MAX_AGE = 90 * DAY_IN_SECONDS;

	/**
	 * Hook the registrant.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'jetpack_register_announcements', array( __CLASS__, 'register' ) );
	}

	/**
	 * Whether VideoPress shows What's new.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return Feature_Flags::is_enabled( self::FLAG );
	}

	/**
	 * Register the recent posts of Jetpack.com about VideoPress, while the flag is on.
	 *
	 * @return void
	 */
	public static function register() {
		if ( ! self::is_enabled() ) {
			return;
		}

		// Another plugin may load an older copy of the package first.
		if ( ! function_exists( 'Automattic\\Jetpack\\Announcements\\get_announcements_from_feed' ) ) {
			return;
		}

		$announcements = get_announcements_from_feed( self::FEED_URL, self::CHANNEL, array( 'max_age' => self::MAX_AGE ) );

		foreach ( $announcements as $announcement ) {
			if ( in_array( self::LABEL, $announcement['categories'], true ) ) {
				register_announcement( $announcement['id'], $announcement['args'] + array( 'channels' => array( self::CHANNEL ) ) );
			}
		}
	}
}
