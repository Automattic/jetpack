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
 * Promotes an existing pending podcatcher `podcasting_show_states` entry to
 * `'active'` the first time we see its UA fetch the feed. Idempotent
 * thereafter.
 */
class Feed_Detection {

	/**
	 * UA needle → podcatcher slug. First match wins, so order matters: more
	 * specific brand needles (e.g. `GooglePodcasts`, `YouTubeMusic`) come
	 * before generic ones (e.g. Apple's `Podcasts/`) that they share a
	 * substring with.
	 *
	 * Cross-referenced against opawg/user-agents-v2 (the OPAWG community
	 * dataset used by Podtrac, Megaphone, Art19, Chartable). When directories
	 * change UAs or new ones emerge, sync the relevant entries here:
	 *   https://github.com/opawg/user-agents-v2/blob/master/src/{apps,bots}.json
	 *
	 * @var array<string, string>
	 */
	private const NEEDLES = array(
		// YouTube / Google Podcasts — listed first so `GooglePodcasts/`
		// doesn't get caught by Apple's broader `Podcasts/` needle below.
		'Google-Podcast'       => 'youtube',
		'YouTube-Podcast'      => 'youtube',
		'GooglePodcasts'       => 'youtube',
		'GoogleChirp'          => 'youtube',
		'YouTubeMusic'         => 'youtube',

		// Apple Podcasts (iOS app, Mac app, automated checks, HomePod, Apple TV).
		'iTMS'                 => 'apple',
		'AppleCoreMedia'       => 'apple',
		'Podcasts/'            => 'apple',
		'iTunes'               => 'apple',
		'AirPodcasts/'         => 'apple',

		// Spotify — substring catches `Spotify/…`, `spotify-rss-…`, all variants.
		'Spotify'              => 'spotify',

		// Pocket Casts.
		'Pocket Casts'         => 'pocketcasts',
		'PocketCasts'          => 'pocketcasts',

		// Amazon — `AmazonMusic` is the listening app; `Amazon Music Podcast`
		// (with spaces) is the actual feed crawler. Keep both.
		'AmazonMusic'          => 'amazon',
		'Amazon Music Podcast' => 'amazon',

		// Podcast Index — substring `PodcastIndex` catches `Podcastindex.org/`,
		// `PodcastIndexer/`, `PodcastIndexManager/`, `PodcastIndex Classifier/`.
		'PodcastIndex'         => 'podcastindex',
	);

	/**
	 * Inspect the current request's User-Agent and, if it's a directory
	 * crawler with an existing pending state, mark its state `'active'`.
	 * No-op if the UA is missing, not in the directory allowlist, or the
	 * matched directory has no pending state.
	 */
	public static function detect_and_record(): void {
		$ua = isset( $_SERVER['HTTP_USER_AGENT'] )
			? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) )
			: '';
		if ( '' === $ua ) {
			return;
		}

		$slug = null;
		foreach ( self::NEEDLES as $needle => $candidate ) {
			if ( false !== stripos( $ua, $needle ) ) {
				$slug = $candidate;
				break;
			}
		}

		if ( null === $slug || ! isset( Settings::SHOW_URL_HOSTS[ $slug ] ) ) {
			return;
		}

		$states = get_option( 'podcasting_show_states', array() );
		if ( ! is_array( $states ) ) {
			$states = array();
		}

		if ( ! isset( $states[ $slug ] ) || 'pending' !== $states[ $slug ] ) {
			return;
		}

		// Concurrent first-fetches from different apps can race the read-modify-write.
		// Benign: the loser's next poll (multi-hour cadence) re-writes its key. Worst
		// case is one app sitting in `pending` for one extra poll cycle.
		$states[ $slug ] = 'active';
		update_option( 'podcasting_show_states', $states );
	}
}
