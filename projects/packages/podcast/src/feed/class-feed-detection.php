<?php
/**
 * Records the first time a tracked podcatcher fetches the podcast feed.
 *
 * Mirrors `Automattic_Podcasting_Feed_Detection` in the wpcom mu-plugin
 * (wp-content/mu-plugins/podcasting/feed-detection.php). Called once per
 * feed request from `Podcast::maybe_load_feed_customization()`; reads the
 * UA, classifies it via App_Detection, and flips
 * `podcasting_show_states[$slug]` to 'active' the first time we see one
 * of the tracked slugs. Already-active slugs short-circuit so we don't
 * thrash the option on every feed poll.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Feed;

use Throwable;

/**
 * Single static entry point: detect_and_record().
 */
class Feed_Detection {

	/**
	 * Slugs we surface in the Distribution UI. Anything else App_Detection
	 * resolves (e.g. overcast, castbox) is observed but not recorded —
	 * the UI only has rows for these six.
	 *
	 * @var array<int, string>
	 */
	private const TRACKED_SLUGS = array( 'apple', 'spotify', 'pocketcasts', 'amazon', 'podcastindex', 'youtube' );

	/**
	 * Read the UA, match it against the tracked slugs, mark active in the
	 * `podcasting_show_states` option on first sighting. Wrapped in a
	 * try/catch so a misbehaving option store can never fatal the feed
	 * response itself.
	 */
	public static function detect_and_record() {
		try {
			$ua = isset( $_SERVER['HTTP_USER_AGENT'] )
				? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) )
				: '';
			if ( '' === $ua ) {
				return;
			}

			$slug = self::match_podcatcher( $ua );
			if ( null === $slug ) {
				return;
			}

			$states = get_option( 'podcasting_show_states', array() );
			if ( ! is_array( $states ) ) {
				$states = array();
			}
			if ( isset( $states[ $slug ] ) && 'active' === $states[ $slug ] ) {
				return;
			}

			// Concurrent first-time fetches from different apps can race the
			// read-modify-write and clobber each other's key. Benign: the next
			// poll from the losing app (apps poll on a multi-hour cadence)
			// hits this same path and re-writes its key. Worst-case UI cost is
			// one app sitting in `pending` for a poll cycle.
			$states[ $slug ] = 'active';
			update_option( 'podcasting_show_states', $states );
		} catch ( Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Detection is best-effort. Logging would require a wpcom-only
			// helper; on Atomic we'd need a different transport. Swallow
			// silently here — if we ever wire in a Jetpack-side logger,
			// emit an event from this branch.
		}
	}

	/**
	 * Resolve a UA to one of TRACKED_SLUGS, or null.
	 *
	 * @param string $ua Raw User-Agent header.
	 * @return string|null
	 */
	private static function match_podcatcher( $ua ) {
		$slug = App_Detection::detect_slug( $ua );
		if ( null === $slug || ! in_array( $slug, self::TRACKED_SLUGS, true ) ) {
			return null;
		}
		return $slug;
	}
}
