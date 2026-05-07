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
 */
class App_Detection {

	/**
	 * UA needle → podcatcher slug. First match wins.
	 *
	 * @var array<string, string>
	 */
	const NEEDLES = array(
		'iTMS'             => 'apple',
		'AppleCoreMedia'   => 'apple',
		'Podcasts/'        => 'apple',
		'iTunes'           => 'apple',
		'Spotify'          => 'spotify',
		'Pocket Casts'     => 'pocketcasts',
		'PocketCasts'      => 'pocketcasts',
		'AmazonMusic'      => 'amazon',
		'Podcastindex.org' => 'podcastindex',
		// YouTube Music podcasts hasn't published an official UA — using the
		// legacy Google Podcasts crawler until we observe a stable signature.
		'Google-Podcast'   => 'youtube',
		'YouTube-Podcast'  => 'youtube',
		'Overcast'         => 'overcast',
		'Podcast Addict'   => 'podcast-addict',
		'CastBox'          => 'castbox',
		'Castro'           => 'castro',
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
