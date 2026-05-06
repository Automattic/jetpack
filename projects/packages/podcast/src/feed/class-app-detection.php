<?php
/**
 * UA-needle to podcatcher slug map.
 *
 * Mirrors `Automattic_Podcasting_App_Detection` in the wpcom mu-plugin
 * (wp-content/mu-plugins/podcasting/app-detection.php) so a UA classified
 * one way on Simple gets classified the same way on Atomic. Order of the
 * needle list matters — first match wins, so Apple's three variants come
 * before any Safari/-bearing UAs.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Feed;

/**
 * Static helpers for matching a User-Agent string to a podcatcher slug.
 */
class App_Detection {

	/**
	 * Needle → slug. First substring match (case-insensitive) wins.
	 *
	 * @var array<string, string>
	 */
	private const NEEDLES = array(
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
	 * Return the matching slug for a UA, or null if nothing matches.
	 *
	 * @param string $ua Raw User-Agent header.
	 * @return string|null
	 */
	public static function detect_slug( $ua ) {
		if ( ! is_string( $ua ) || '' === $ua ) {
			return null;
		}
		foreach ( self::NEEDLES as $needle => $slug ) {
			if ( false !== stripos( $ua, $needle ) ) {
				return $slug;
			}
		}
		return null;
	}

	/**
	 * True for the standard browser tokens. Used by play-tracking elsewhere;
	 * the feed detector doesn't care about web browsers.
	 *
	 * @param string $ua Raw User-Agent header.
	 * @return bool
	 */
	public static function is_web_browser( $ua ) {
		if ( ! is_string( $ua ) || '' === $ua ) {
			return false;
		}
		return (bool) preg_match( '#Mozilla/|Chrome/|Safari/|Firefox/#', $ua );
	}
}
