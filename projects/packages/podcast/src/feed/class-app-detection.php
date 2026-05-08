<?php
/**
 * Classifies podcast app User-Agent strings to a known podcatcher slug.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast\Feed;

/**
 * First-substring-match (case-insensitive) over `NEEDLES`. Used by
 * `Feed_Detection` to identify directory crawlers; not used by the package's
 * play-tracking path because that lives at WPCOM.
 *
 * Patterns cross-referenced against opawg/user-agents-v2 (the OPAWG community
 * dataset used by Podtrac, Megaphone, Art19, Chartable). When directories
 * change UAs or new ones emerge, sync the relevant entries here:
 *   https://github.com/opawg/user-agents-v2/blob/master/src/{apps,bots}.json
 */
class App_Detection {

	/**
	 * UA needle → podcatcher slug. First match wins, so order matters: more
	 * specific brand needles (e.g. `GooglePodcasts`, `YouTubeMusic`) come
	 * before generic ones (e.g. Apple's `Podcasts/`) that they share a
	 * substring with.
	 *
	 * @var array<string, string>
	 */
	const NEEDLES = array(
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

		// Detected but not in `Settings::SHOW_URL_HOSTS`, so `Feed_Detection`
		// no-ops. Reserved for future analytics consumers.
		'Overcast'             => 'overcast',
		'Podcast Addict'       => 'podcast-addict',
		'CastBox'              => 'castbox',
		'Castro'               => 'castro',
	);

	/**
	 * Match a User-Agent against the needle table and return its slug.
	 *
	 * @param string $ua User-Agent header.
	 * @return string|null Podcatcher slug, or null if nothing matches.
	 */
	public static function detect_slug( string $ua ): ?string {
		if ( '' === $ua ) {
			return null;
		}
		foreach ( self::NEEDLES as $needle => $slug ) {
			if ( false !== stripos( $ua, $needle ) ) {
				return $slug;
			}
		}
		return null;
	}
}
