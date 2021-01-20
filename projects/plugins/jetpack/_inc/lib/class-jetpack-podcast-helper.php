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
	 *    @type string     $query A search query to find podcast episodes.
	 * }
	 * @return array|WP_Error  The player data or a error object.
	 */
	public function get_player_data( $args = array() ) {
		$guid  = ! empty( $args['guid'] ) ? $args['guid'] : '';
		$query = ! empty( $args['query'] ) ? $args['query'] : '';

		// Try loading data from the cache.
		$transient_key = 'jetpack_podcast_' . md5( $this->feed . ":id:$guid:query:$query" );
		$player_data   = get_transient( $transient_key );

		// Fetch data if we don't have any cached.
		if ( false === $player_data || ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ) {
			// Load feed.
			$rss = $this->load_feed();

			if ( is_wp_error( $rss ) ) {
				return $rss;
			}

			// Get tracks or a single episode.
			if ( ! empty( $guid ) ) {
				$track  = $this->get_track_data( $guid );
				$tracks = is_wp_error( $track ) ? null : array( $track );
			} elseif ( ! empty( $query ) ) {
				$tracks = $this->search_tracks( $query );
				$tracks = is_wp_error( $tracks ) ? null : $tracks;
			} else {
				$tracks = $this->get_track_list();
				if ( empty( $tracks ) ) {
					return new WP_Error( 'no_tracks', __( 'Your Podcast couldn\'t be embedded as it doesn\'t contain any tracks. Please double check your URL.', 'jetpack' ) );
				}
			}

			// Get podcast meta.
			$title = $rss->get_title();
			$title = $this->get_plain_text( $title );

			$cover = $rss->get_image_url();
			$cover = ! empty( $cover ) ? esc_url( $cover ) : null;

			$link = $rss->get_link();
			$link = ! empty( $link ) ? esc_url( $link ) : null;

			$player_data = array(
				'title' => $title,
				'link'  => $link,
				'cover' => $cover,
			);

			if ( $tracks ) {
				$player_data['tracks'] = $tracks;
			}

			// Cache for 1 hour.
			set_transient( $transient_key, $player_data, HOUR_IN_SECONDS );
		}

		return $player_data;
	}

	/**
	 * Does a simplistic fuzzy search of the podcast episode titles using the given search term.
	 *
	 * @param  string $query  The search term to find.
	 * @return array|WP_Error An array of up to 10 matching episode details, or a `WP_Error` if there's an error
	 */
	public function search_tracks( $query ) {
		// We're going to sanitize strings by removing accents, and we need to set a locale for that.
		$current_locale = setlocale( LC_ALL, 0 );
		$transient_key  = 'jetpack_podcast_search_' . md5( $this->feed );
		$search_data    = get_transient( $transient_key );
		$needle         = $this->sanitize_for_search( $query );

		// Check we have a valid search term.
		if ( empty( $needle ) ) {
			return new WP_Error( 'no_query', __( 'The search query is invalid as it contains no alphanumeric characters.', 'jetpack' ) );
		}

		// Fetch data if we don't have any cached.
		if ( false === $search_data || ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ) {
			$rss = $this->load_feed();

			if ( is_wp_error( $rss ) ) {
				return $rss;
			}

			setlocale( LC_ALL, 'en_US.utf8' );
			$track_list  = array_values( array_filter( array_map( array( __CLASS__, 'setup_tracks_callback' ), $rss->get_items() ) ) );
			$search_data = array_map(
				function ( $track ) {
					// We don't want the search string to be too long or it could cause problems with levenshtein.
					$track['search_cache'] = $this->sanitize_for_search( substr( $track['title'], 0, 255 ) );
					return $track;
				},
				$track_list
			);
			set_transient( $transient_key, $search_data, HOUR_IN_SECONDS );
		}

		// Calculate the levenshtein scores for each track.
		$search_data = array_map(
			function ( $track ) use ( $needle ) {
				$track['score'] = levenshtein( $track['search_cache'], $needle );
				return $track;
			},
			$search_data
		);

		// Filter out any values that are too far away.
		$needle_length = strlen( $needle );
		$search_data   = array_filter(
			$search_data,
			function ( $track ) use ( $needle_length ) {
				return $track['score'] <= ( strlen( $track['search_cache'] ) - $needle_length );
			}
		);

		// Sort the data by doing a fuzzy search for the query string.
		usort(
			$search_data,
			function ( $a, $b ) use ( $needle ) {
				$in_a = strpos( $a['search_cache'], $needle ) !== false;
				$in_b = strpos( $b['search_cache'], $needle ) !== false;
				if ( $in_a && ! $in_b ) {
					return -1;
				}
				if ( ! $in_a && $in_b ) {
					return 1;
				}

				if ( $a['score'] === $b['score'] ) {
					return 0;
				}
				return $a['score'] < $b['score'] ? -1 : 1;
			}
		);

		// Make sure we restore the locale.
		setlocale( LC_ALL, $current_locale );
		return array_slice( $search_data, 0, 10 );
	}

	/**
	 * Converts a string to alphanumeric values and spaces, in order to help with matching
	 *
	 * @param  string $string The string to sanitize.
	 * @return string         The string converted to just alphanumeric characters, removing accents etc.
	 */
	private function sanitize_for_search( $string ) {
		$unaccented = iconv( 'UTF-8', 'ASCII//TRANSLIT//IGNORE', $string );
		return trim(
			preg_replace(
				'/\s+/',
				' ',
				preg_replace(
					'/[^a-z0-9]+/',
					' ',
					strtolower( $unaccented )
				)
			)
		);
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
	 * @return SimplePie|WP_Error The RSS object or error.
	 */
	public function load_feed() {
		$rss = fetch_feed( $this->feed );
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
			'id'          => wp_unique_id( 'podcast-track-' ),
			'link'        => esc_url( $episode->get_link() ),
			'src'         => esc_url( $enclosure->link ),
			'type'        => esc_attr( $enclosure->type ),
			'description' => $this->get_plain_text( $episode->get_description() ),
			'title'       => $this->get_plain_text( $episode->get_title() ),
			'image'       => esc_url( $this->get_episode_image_url( $episode ) ),
			'guid'        => $this->get_plain_text( $episode->get_id() ),
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
					'id'          => array(
						'description' => __( 'The episode id. Generated per request, not globally unique.', 'jetpack' ),
						'type'        => 'string',
					),
					'link'        => array(
						'description' => __( 'The external link for the episode.', 'jetpack' ),
						'type'        => 'string',
						'format'      => 'uri',
					),
					'src'         => array(
						'description' => __( 'The audio file URL of the episode.', 'jetpack' ),
						'type'        => 'string',
						'format'      => 'uri',
					),
					'type'        => array(
						'description' => __( 'The mime type of the episode.', 'jetpack' ),
						'type'        => 'string',
					),
					'description' => array(
						'description' => __( 'The episode description, in plaintext.', 'jetpack' ),
						'type'        => 'string',
					),
					'title'       => array(
						'description' => __( 'The episode title.', 'jetpack' ),
						'type'        => 'string',
					),
				),
			),
		);
	}
}
