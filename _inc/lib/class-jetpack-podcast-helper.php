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
	 * Gets a list of tracks for the supplied RSS feed. This function is used
	 * in both server-side block rendering and in API `WPCOM_REST_API_V2_Endpoint_Podcast_Player`.
	 *
	 * @param string $feed     The RSS feed to load and list tracks for.
	 * @param int    $quantity Optional. The number of tracks to return.
	 * @return array|WP_Error The feed's tracks or a error object.
	 */
	public static function get_track_list( $feed, $quantity = 10 ) {
		$rss = fetch_feed( $feed );

		if ( is_wp_error( $rss ) ) {
			return new WP_Error( 'invalid_url', __( 'Your podcast couldn\'t be embedded. Please double check your URL.', 'jetpack' ) );
		}

		if ( ! $rss->get_item_quantity() ) {
			return new WP_Error( 'no_tracks', __( 'Podcast audio RSS feed has no tracks.', 'jetpack' ) );
		}

		$track_list = array_map( array( __CLASS__, 'setup_tracks_callback' ), $rss->get_items( 0, $quantity ) );

		// Remove empty tracks.
		return array_filter( $track_list );
	}

	/**
	 * Prepares Episode data to be used with MediaElement.js.
	 *
	 * @param SimplePie_Item $episode SimplePie_Item object, representing a podcast episode.
	 * @return array
	 */
	private static function setup_tracks_callback( SimplePie_Item $episode ) {
		$enclosure = self::get_audio_enclosure( $episode );

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
			'description' => wp_kses_post( $episode->get_description() ),
			'title'       => esc_html( trim( wp_strip_all_tags( $episode->get_title() ) ) ),
		);

		if ( empty( $track['title'] ) ) {
			$track['title'] = esc_html__( '(no title)', 'jetpack' );
		}

		if ( ! empty( $enclosure->duration ) ) {
			$track['duration'] = self::format_track_duration( $enclosure->duration );
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

		// Default to empty SimplePie_Enclosure object.
		return $episode->get_enclosure();
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
