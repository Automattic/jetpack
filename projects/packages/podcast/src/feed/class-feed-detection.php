<?php
/**
 * Records when podcast directory crawlers fetch the feed.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast\Feed;

use Automattic\Jetpack\Podcast\Settings;

/**
 * Promotes a podcatcher's `podcasting_show_states` entry to `'active'` the
 * first time we see its UA fetch the feed. Idempotent thereafter.
 */
class Feed_Detection {

	/**
	 * Inspect the current request's User-Agent and, if it's a tracked
	 * podcatcher, mark its state `'active'`. No-op if the UA is missing or
	 * not in the directory allowlist.
	 */
	public static function detect_and_record(): void {
		$ua = isset( $_SERVER['HTTP_USER_AGENT'] )
			? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) )
			: '';

		$slug = App_Detection::detect_slug( $ua );
		if ( null === $slug || ! isset( Settings::SHOW_URL_HOSTS[ $slug ] ) ) {
			return;
		}

		$states = get_option( 'podcasting_show_states', array() );
		if ( ! is_array( $states ) ) {
			$states = array();
		}

		if ( isset( $states[ $slug ] ) && 'active' === $states[ $slug ] ) {
			return;
		}

		// Concurrent first-fetches from different apps can race the read-modify-write.
		// Benign: the loser's next poll (multi-hour cadence) re-writes its key. Worst
		// case is one app sitting in `pending` for one extra poll cycle.
		$states[ $slug ] = 'active';
		update_option( 'podcasting_show_states', $states );
	}
}
