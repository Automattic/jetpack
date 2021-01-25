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
	 * The RSS feed of the podcast.
	 *
	 * @var string
	 */
	protected $feed = null;

	/**
	 * Initialize class.
	 *
	 * @param string $feed The RSS feed of the podcast.
	 */
	public function __construct( $feed ) {
		$this->feed = esc_url_raw( $feed );
	}

	/**
	 * Gets podcast data formatted to be used by the Podcast Player block in both server-side
	 * block rendering and in API `WPCOM_REST_API_V2_Endpoint_Podcast_Player`.
	 *
	 * The result is cached for one hour.
	 *
	 * @param array $args {
	 *    Optional array of arguments.
	 *    @type string|int $guid  The ID of a specific episode to return rather than a list.
	 * }
	 *
	 * @return array|WP_Error  The player data or a error object.
	 */
	public function get_player_data( $args = array() ) {
		$guids = isset( $args['guids'] ) && $args['guids'] ? $args['guids'] : array();

		// Try loading data from the cache.
		$transient_key = 'jetpack_podcast_' . md5( $this->feed . implode( ',', $guids ) );
		$player_data   = get_transient( $transient_key );

		// Fetch data if we don't have any cached.
		if ( false === $player_data || ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ) {
			// Load feed.
			$rss = $this->load_feed();

			if ( is_wp_error( $rss ) ) {
				return $rss;
			}

			// Get a list of episodes by guid or all tracks in feed.
			if ( count( $guids ) ) {
				$tracks = array_map( array( $this, 'get_track_data' ), $guids );
				$tracks = array_filter(
					$tracks,
					function ( $track ) {
						return ! is_wp_error( $track );
					}
				);
			} else {
				$tracks = $this->get_track_list();
			}

			if ( empty( $tracks ) ) {
				return new WP_Error( 'no_tracks', __( 'Your Podcast couldn\'t be embedded as it doesn\'t contain any tracks. Please double check your URL.', 'jetpack' ) );
			}

			// Get podcast meta.
			$title = $rss->get_title();
			$title = $this->get_plain_text( $title );

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
	 * Gets a specific track from the supplied feed URL.
	 *
	 * @param string $guid     The GUID of the track.
	 * @return array|WP_Error  The track object or an error object.
	 */
	public function get_track_data( $guid ) {
		// Try loading track data from the cache.
		$transient_key = 'jetpack_podcast_' . md5( "$this->feed::$guid" );
		$track_data    = get_transient( $transient_key );

		// Fetch data if we don't have any cached.
		if ( false === $track_data || ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ) {
			// Load feed.
			$rss = $this->load_feed();

			if ( is_wp_error( $rss ) ) {
				return $rss;
			}

			// Loop over all tracks to find the one.
			foreach ( $rss->get_items() as $track ) {
				if ( $guid === $track->get_id() ) {
					$track_data = $this->setup_tracks_callback( $track );
					break;
				}
			}

			if ( false === $track_data ) {
				return new WP_Error( 'no_track', __( 'The track was not found.', 'jetpack' ) );
			}

			// Cache for 1 hour.
			set_transient( $transient_key, $track_data, HOUR_IN_SECONDS );
		}

		return $track_data;
	}

	/**
	 * Gets a list of tracks for the supplied RSS feed.
	 *
	 * @return array|WP_Error The feed's tracks or a error object.
	 */
	public function get_track_list() {
		$rss = $this->load_feed();

		if ( is_wp_error( $rss ) ) {
			return $rss;
		}

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
	protected function get_plain_text( $str ) {
		return $this->sanitize_and_decode_text( $str, true );
	}

	/**
	 * Formats strings as safe HTML.
	 *
	 * @param string $str Input string.
	 * @return string HTML text string safe for post_content.
	 */
	protected function get_html_text( $str ) {
		return $this->sanitize_and_decode_text( $str, false );
	}

	/**
	 * Strip unallowed html tags and decode entities.
	 *
	 * @param string  $str Input string.
	 * @param boolean $strip_all_tags Strip all tags, otherwise allow post_content safe tags.
	 * @return string Sanitized and decoded text.
	 */
	protected function sanitize_and_decode_text( $str, $strip_all_tags = true ) {
		// Trim string and return if empty.
		$str = trim( (string) $str );
		if ( empty( $str ) ) {
			return '';
		}

		if ( $strip_all_tags ) {
			// Make sure there are no tags.
			$str = wp_strip_all_tags( $str );
		} else {
			$str = wp_kses_post( $str );
		}

		// Replace all entities with their characters, including all types of quotes.
		$str = html_entity_decode( $str, ENT_QUOTES );

		return $str;
	}

	/**
	 * Loads an RSS feed using `fetch_feed`.
	 *
	 * @return SimplePie|WP_Error The RSS object or error.
	 */
	public function load_feed() {
		add_action( 'wp_feed_options', array( __CLASS__, 'set_podcast_locator' ) );
		$rss = fetch_feed( $this->feed );
		remove_action( 'wp_feed_options', array( __CLASS__, 'set_podcast_locator' ) );
		if ( is_wp_error( $rss ) ) {
			return new WP_Error( 'invalid_url', __( 'Your podcast couldn\'t be embedded. Please double check your URL.', 'jetpack' ) );
		}

		if ( ! $rss->get_item_quantity() ) {
			return new WP_Error( 'no_tracks', __( 'Podcast audio RSS feed has no tracks.', 'jetpack' ) );
		}

		return $rss;
	}

	/**
	 * Action handler to set our podcast specific feed locator class on the SimplePie object.
	 *
	 * @param SimplePie $feed The SimplePie object, passed by reference.
	 */
	public static function set_podcast_locator( &$feed ) {
		if ( ! class_exists( 'Jetpack_Podcast_Feed_Locator' ) ) {
			jetpack_require_lib( 'class-jetpack-podcast-feed-locator' );
		}

		$feed->set_locator_class( 'Jetpack_Podcast_Feed_Locator' );
	}

	/**
	 * Prepares Episode data to be used by the Podcast Player block.
	 *
	 * @param SimplePie_Item $episode SimplePie_Item object, representing a podcast episode.
	 * @return array
	 */
	protected function setup_tracks_callback( SimplePie_Item $episode ) {
		$enclosure = $this->get_audio_enclosure( $episode );

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
			'id'               => wp_unique_id( 'podcast-track-' ),
			'link'             => esc_url( $episode->get_link() ),
			'src'              => esc_url( $enclosure->link ),
			'type'             => esc_attr( $enclosure->type ),
			'description'      => $this->get_plain_text( $episode->get_description() ),
			'description_html' => $this->get_html_text( $episode->get_description() ),
			'title'            => $this->get_plain_text( $episode->get_title() ),
			'image'            => esc_url( $this->get_episode_image_url( $episode ) ),
			'guid'             => $this->get_plain_text( $episode->get_id() ),
		);

		if ( empty( $track['title'] ) ) {
			$track['title'] = esc_html__( '(no title)', 'jetpack' );
		}

		if ( ! empty( $enclosure->duration ) ) {
			$track['duration'] = esc_html( $this->format_track_duration( $enclosure->duration ) );
		}

		return $track;
	}

	/**
	 * Retrieves an episode's image URL, if it's available.
	 *
	 * @param SimplePie_Item $episode SimplePie_Item object, representing a podcast episode.
	 * @param string         $itunes_ns The itunes namespace, defaulted to the standard 1.0 version.
	 * @return string|null The image URL or null if not found.
	 */
	protected function get_episode_image_url( SimplePie_Item $episode, $itunes_ns = 'http://www.itunes.com/dtds/podcast-1.0.dtd' ) {
		$image = $episode->get_item_tags( $itunes_ns, 'image' );
		if ( isset( $image[0]['attribs']['']['href'] ) ) {
			return $image[0]['attribs']['']['href'];
		}
		return null;
	}

	/**
	 * Retrieves an audio enclosure.
	 *
	 * @param SimplePie_Item $episode SimplePie_Item object, representing a podcast episode.
	 * @return SimplePie_Enclosure|null
	 */
	protected function get_audio_enclosure( SimplePie_Item $episode ) {
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
	protected function format_track_duration( $duration ) {
		$format = $duration > HOUR_IN_SECONDS ? 'H:i:s' : 'i:s';

		return date_i18n( $format, $duration );
	}

	/**
	 * Gets podcast player data schema.
	 *
	 * Useful for json schema in REST API endpoints.
	 *
	 * @return array Player data json schema.
	 */
	public static function get_player_data_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-podcast-player-data',
			'type'       => 'object',
			'properties' => array(
				'title'  => array(
					'description' => __( 'The title of the podcast.', 'jetpack' ),
					'type'        => 'string',
				),
				'link'   => array(
					'description' => __( 'The URL of the podcast website.', 'jetpack' ),
					'type'        => 'string',
					'format'      => 'uri',
				),
				'cover'  => array(
					'description' => __( 'The URL of the podcast cover image.', 'jetpack' ),
					'type'        => 'string',
					'format'      => 'uri',
				),
				'tracks' => self::get_tracks_schema(),
			),
		);
	}

	/**
	 * Gets tracks data schema.
	 *
	 * Useful for json schema in REST API endpoints.
	 *
	 * @return array Tracks json schema.
	 */
	public static function get_tracks_schema() {
		return array(
			'description' => __( 'Latest episodes of the podcast.', 'jetpack' ),
			'type'        => 'array',
			'items'       => array(
				'type'       => 'object',
				'properties' => array(
					'id'               => array(
						'description' => __( 'The episode id. Generated per request, not globally unique.', 'jetpack' ),
						'type'        => 'string',
					),
					'link'             => array(
						'description' => __( 'The external link for the episode.', 'jetpack' ),
						'type'        => 'string',
						'format'      => 'uri',
					),
					'src'              => array(
						'description' => __( 'The audio file URL of the episode.', 'jetpack' ),
						'type'        => 'string',
						'format'      => 'uri',
					),
					'type'             => array(
						'description' => __( 'The mime type of the episode.', 'jetpack' ),
						'type'        => 'string',
					),
					'description'      => array(
						'description' => __( 'The episode description, in plaintext.', 'jetpack' ),
						'type'        => 'string',
					),
					'description_html' => array(
						'description' => __( 'The episode description with allowed html tags.', 'jetpack' ),
						'type'        => 'string',
					),
					'title'            => array(
						'description' => __( 'The episode title.', 'jetpack' ),
						'type'        => 'string',
					),
				),
			),
		);
	}
}
