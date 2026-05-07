<?php
/**
 * Builds enclosure URLs that point at WPCOM's podcast-play stats endpoint.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast\Feed;

/**
 * Generates `https://public-api.wordpress.com/wpcom/v2/sites/{blog_id}/podcast-play/{post_id}.{ext}`
 * URLs for podcast feed enclosures. The endpoint redirects to the audio file
 * after recording the play — the package never serves it, only points at it.
 */
class Stats_Url {

	const REST_NAMESPACE          = 'wpcom/v2';
	const REST_BASE               = 'podcast-play';
	const DEFAULT_AUDIO_EXTENSION = 'mp3';

	/**
	 * Audio extensions WPCOM's redirect endpoint recognizes. URLs with anything
	 * else fall back to `DEFAULT_AUDIO_EXTENSION` so the URL shape stays uniform —
	 * matches the convention used by Podtrac, Art19, Megaphone, etc.
	 *
	 * @var string[]
	 */
	const KNOWN_AUDIO_EXTENSIONS = array( 'mp3', 'm4a', 'm4b', 'mp4', 'aac', 'ogg', 'oga', 'opus', 'wav', 'flac' );

	/**
	 * Build the public-api stats URL for a given episode.
	 *
	 * @param int    $blog_id WPCOM blog ID. On Atomic, callers should pass the WPCOM
	 *                        shadow ID via the `wpcom_podcasting_tracked_blog_id` filter
	 *                        so the redirect endpoint routes to the right blog.
	 * @param int    $post_id Episode post ID.
	 * @param string $ext     Audio file extension; normalized to a known value or `mp3`.
	 * @return string
	 */
	public static function generate_url( int $blog_id, int $post_id, string $ext = self::DEFAULT_AUDIO_EXTENSION ): string {
		return sprintf(
			'https://public-api.wordpress.com/%s/sites/%d/%s/%d.%s',
			self::REST_NAMESPACE,
			$blog_id,
			self::REST_BASE,
			$post_id,
			self::normalize_extension( $ext )
		);
	}

	/**
	 * Pull the audio extension out of an enclosure URL.
	 *
	 * @param string $url Original enclosure URL.
	 * @return string
	 */
	public static function get_audio_extension( string $url ): string {
		$path = (string) wp_parse_url( $url, PHP_URL_PATH );
		$ext  = (string) pathinfo( $path, PATHINFO_EXTENSION );
		return self::normalize_extension( $ext );
	}

	/**
	 * Lowercase, strip non-alphanumerics, fall back to `DEFAULT_AUDIO_EXTENSION`
	 * if the result isn't in `KNOWN_AUDIO_EXTENSIONS`.
	 *
	 * @param string $ext Raw extension.
	 * @return string
	 */
	private static function normalize_extension( string $ext ): string {
		$ext = (string) preg_replace( '/[^a-z0-9]/', '', strtolower( $ext ) );
		return in_array( $ext, self::KNOWN_AUDIO_EXTENSIONS, true ) ? $ext : self::DEFAULT_AUDIO_EXTENSION;
	}
}
