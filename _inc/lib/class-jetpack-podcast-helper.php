<?php
/**
 * Helper to massage Podcast data to be used in the Podcast block.
 *
 * @package jetpack
 */

/**
 * Class Jetpack_Podcast_Helper
 */
class Jetpack_Podcast_Helper {
	/**
	 * Gets podcast data formatted to be used by the Podcast Player block in both server-side
	 * block rendering and in API `WPCOM_REST_API_V2_Endpoint_Podcast_Player`.
	 *
	 * The result is cached for one hour.
	 *
	 * @param string $feed     The RSS feed to load and list tracks for.
	 * @return array|WP_Error The player data or a error object.
	 */
	public static function get_player_data( $feed ) {
		$feed = esc_url_raw( $feed );

		// Try loading data from the cache.
		$transient_key = 'jetpack_podcast_' . md5( $feed );
		$player_data   = get_transient( $transient_key );

		// Fetch data if we don't have any cached.
		if ( false === $player_data || ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ) {
			// Load feed.
			$rss = self::load_feed( $feed );

			if ( is_wp_error( $rss ) ) {
				return $rss;
			}

			// Get tracks.
			$tracks = self::get_track_list( $rss );

			if ( empty( $tracks ) ) {
				return new WP_Error( 'no_tracks', __( 'Your Podcast couldn\'t be embedded as it doesn\'t contain any tracks. Please double check your URL.', 'jetpack' ) );
			}

			// Get podcast meta.
			$title = $rss->get_title();
			$title = self::get_plain_text( $title );

			$cover = $rss->get_image_url();
			$cover = ! empty( $cover ) ? esc_url( $cover ) : null;

			$link = $rss->get_link();
			$link = ! empty( $link ) ? esc_url( $link ) : null;

			$player_data = array(
				'title'  => $title,
				'link'   => $link,
				'cover'  => $cover,
				'tracks' => $tracks,
			);

			// Cache for 1 hour.
			set_transient( $transient_key, $player_data, HOUR_IN_SECONDS );
		}

		return $player_data;
	}

	/**
	 * Gets a list of tracks for the supplied RSS feed.
	 *
	 * @param string $rss      The RSS feed to load and list tracks for.
	 * @return array|WP_Error The feed's tracks or a error object.
	 */
	private static function get_track_list( $rss ) {
		// Get first ten items and format them.
		$track_list = array_map( array( __CLASS__, 'setup_tracks_callback' ), $rss->get_items( 0, 10 ) );

		// Filter out any tracks that are empty.
		// Reset the array indicies.
		return array_values( array_filter( $track_list ) );
	}

	/**
	 * Formats string as pure plaintext, with no HTML tags or entities present.
	 * This is ready to be used in React, innerText but needs to be escaped
	 * using standard `esc_html` when generating markup on server.
	 *
	 * @param string $str Input string.
	 * @return string Plain text string.
	 */
	private static function get_plain_text( $str ) {
		// Trim string and return if empty.
		$str = trim( (string) $str );
		if ( empty( $str ) ) {
			return '';
		}

		// Make sure there are no tags.
		$str = wp_strip_all_tags( $str );

		// Replace all entities with their characters, including all types of quotes.
		$str = html_entity_decode( $str, ENT_QUOTES );

		return $str;
	}

	/**
	 * Loads an RSS feed using `fetch_feed`.
	 *
	 * @param string $feed        The RSS feed URL to load.
	 * @return SimplePie|WP_Error The RSS object or error.
	 */
	private static function load_feed( $feed ) {
		$rss = fetch_feed( esc_url_raw( $feed ) );

		if ( is_wp_error( $rss ) ) {
			return new WP_Error( 'invalid_url', __( 'Your podcast couldn\'t be embedded. Please double check your URL.', 'jetpack' ) );
		}

		if ( ! $rss->get_item_quantity() ) {
			return new WP_Error( 'no_tracks', __( 'Podcast audio RSS feed has no tracks.', 'jetpack' ) );
		}

		return $rss;
	}

	/**
	 * Prepares Episode data to be used by the Podcast Player block.
	 *
	 * @param SimplePie_Item $episode SimplePie_Item object, representing a podcast episode.
	 * @return array
	 */
	private static function setup_tracks_callback( SimplePie_Item $episode ) {
		$enclosure = self::get_audio_enclosure( $episode );

		// If the audio enclosure is empty then it is not playable.
		// We therefore return an empty array for this track.
		// It will be filtered out later.
		if ( is_wp_error( $enclosure ) ) {
			return array();
		}

		// If there is no link return an empty array. We will filter out later.
		if ( empty( $enclosure->link ) ) {
			return array();
		}

		// Build track data.
		$track = array(
			'id'          => wp_unique_id( 'podcast-track-' ),
			'link'        => esc_url( $episode->get_link() ),
			'src'         => esc_url( $enclosure->link ),
			'type'        => esc_attr( $enclosure->type ),
			'description' => self::get_plain_text( $episode->get_description() ),
			'title'       => self::get_plain_text( $episode->get_title() ),
		);

		if ( empty( $track['title'] ) ) {
			$track['title'] = esc_html__( '(no title)', 'jetpack' );
		}

		if ( ! empty( $enclosure->duration ) ) {
			$track['duration'] = esc_html( self::format_track_duration( $enclosure->duration ) );
		}

		return $track;
	}

	/**
	 * Retrieves an audio enclosure.
	 *
	 * @param SimplePie_Item $episode SimplePie_Item object, representing a podcast episode.
	 * @return SimplePie_Enclosure|null
	 */
	private static function get_audio_enclosure( SimplePie_Item $episode ) {
		foreach ( (array) $episode->get_enclosures() as $enclosure ) {
			if ( 0 === strpos( $enclosure->type, 'audio/' ) ) {
				return $enclosure;
			}
		}

		return new WP_Error( 'invalid_audio', __( 'Podcast audio is an invalid type.', 'jetpack' ) );
	}

	/**
	 * Returns the track duration as a formatted string.
	 *
	 * @param number $duration of the track in seconds.
	 * @return string
	 */
	private static function format_track_duration( $duration ) {
		$format = $duration > HOUR_IN_SECONDS ? 'H:i:s' : 'i:s';

		return date_i18n( $format, $duration );
	}
}
