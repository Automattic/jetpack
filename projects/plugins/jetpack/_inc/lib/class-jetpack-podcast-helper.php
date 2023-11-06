<?php
/**
 * Helper to massage Podcast data to be used in the Podcast block.
 *
 * @package automattic/jetpack
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
	 * The number of seconds to cache the podcast feed data.
	 * This value defaults to 1 hour specifically for podcast feeds.
	 * The value can be overridden specifically for podcasts using the
	 * `jetpack_podcast_feed_cache_timeout` filter. Note that the cache timeout value
	 * for all RSS feeds can be modified using the `wp_feed_cache_transient_lifetime`
	 * filter from WordPress core.
	 *
	 * @see https://developer.wordpress.org/reference/hooks/wp_feed_cache_transient_lifetime/
	 * @see WP_Feed_Cache_Transient
	 *
	 * @var int|null
	 */
	protected $cache_timeout = HOUR_IN_SECONDS;

	/**
	 * Initialize class.
	 *
	 * @param string $feed The RSS feed of the podcast.
	 */
	public function __construct( $feed ) {
		$this->feed = esc_url_raw( $feed );

		/**
		 * Filter the number of seconds to cache a specific podcast URL for. The returned value will be ignored if it is null or not a valid integer.
		 * Note that this timeout will only work if the site is using the default `WP_Feed_Cache_Transient` cache implementation for RSS feeds,
		 * or their cache implementation relies on the `wp_feed_cache_transient_lifetime` filter.
		 *
		 * @since 11.3
		 * @see https://developer.wordpress.org/reference/hooks/wp_feed_cache_transient_lifetime/
		 *
		 * @param int|null $cache_timeout The number of seconds to cache the podcast data. Default value is null, so we don't override any defaults from existing filters.
		 * @param string   $podcast_url   The URL of the podcast feed.
		 */
		$podcast_cache_timeout = apply_filters( 'jetpack_podcast_feed_cache_timeout', $this->cache_timeout, $this->feed );

		// Make sure we force new values for $this->cache_timeout to be integers.
		if ( is_numeric( $podcast_cache_timeout ) ) {
			$this->cache_timeout = (int) $podcast_cache_timeout;
		}
	}

	/**
	 * Retrieves tracks quantity.
	 *
	 * @returns int number of tracks
	 */
	public static function get_tracks_quantity() {
		/**
		 * Allow requesting a specific number of tracks from SimplePie's `get_items` call.
		 * The default number of tracks is ten.
		 *
		 * @since 10.4.0
		 *
		 * @param int $number Number of tracks fetched. Default is 10.
		 */
		return (int) apply_filters( 'jetpack_podcast_helper_tracks_quantity', 10 );
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
		$guids           = isset( $args['guids'] ) && $args['guids'] ? $args['guids'] : array();
		$episode_options = isset( $args['episode-options'] ) && $args['episode-options'];

		// Try loading data from the cache.
		$transient_key = 'jetpack_podcast_' . md5( $this->feed . implode( ',', $guids ) . "-$episode_options" );
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

			$description = $rss->get_description();
			$description = $this->get_plain_text( $description );

			$cover = $rss->get_image_url();
			$cover = ! empty( $cover ) ? esc_url( $cover ) : null;

			$link = $rss->get_link();
			$link = ! empty( $link ) ? esc_url( $link ) : null;

			$player_data = array(
				'title'       => $title,
				'description' => $description,
				'link'        => $link,
				'cover'       => $cover,
				'tracks'      => $tracks,
			);

			if ( $episode_options ) {
				$player_data['options'] = array();
				foreach ( $rss->get_items() as $episode ) {
					$enclosure = $this->get_audio_enclosure( $episode );
					// If the episode doesn't have playable audio, then don't include it.
					if ( is_wp_error( $enclosure ) ) {
						continue;
					}
					$player_data['options'][] = array(
						'label' => $this->get_plain_text( $episode->get_title() ),
						'value' => $episode->get_id(),
					);
				}
			}

			// Cache for 1 hour.
			set_transient( $transient_key, $player_data, HOUR_IN_SECONDS );
		}

		return $player_data;
	}

	/**
	 * Gets a specific track from the supplied feed URL.
	 *
	 * @param string  $guid          The GUID of the track.
	 * @param boolean $force_refresh Clear the feed cache.
	 * @return array|WP_Error The track object or an error object.
	 */
	public function get_track_data( $guid, $force_refresh = false ) {
		// Get the cache key.
		$transient_key = 'jetpack_podcast_' . md5( "$this->feed::$guid" );

		// Clear the cache if force_refresh param is true.
		if ( true === $force_refresh ) {
			delete_transient( $transient_key );
		}

		// Try loading track data from the cache.
		$track_data = get_transient( $transient_key );

		// Fetch data if we don't have any cached.
		if ( false === $track_data || ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ) {
			// Load feed.
			$rss = $this->load_feed( $force_refresh );

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

		$tracks_quantity = static::get_tracks_quantity();

		/**
		 * Allow requesting a specific number of tracks from SimplePie's `get_items` call.
		 * The default number of tracks is ten.
		 * Deprecated. Use jetpack_podcast_helper_tracks_quantity filter instead, which takes one less parameter.
		 *
		 * @since 9.5.0
		 * @deprecated 10.4.0
		 *
		 * @param int    $tracks_quantity Number of tracks fetched. Default is 10.
		 * @param object $rss             The SimplePie object built from core's `fetch_feed` call.
		 */
		$tracks_quantity = apply_filters_deprecated( 'jetpack_podcast_helper_list_quantity', array( $tracks_quantity, $rss ), '10.4.0', 'jetpack_podcast_helper_tracks_quantity' );

		// Process the requested number of items from our feed.
		$track_list = array_map( array( __CLASS__, 'setup_tracks_callback' ), $rss->get_items( 0, $tracks_quantity ) );

		// Filter out any tracks that are empty.
		// Reset the array indices.
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
	 * @param boolean $force_refresh Clear the feed cache.
	 * @return SimplePie|WP_Error The RSS object or error.
	 */
	public function load_feed( $force_refresh = false ) {
		// Add action: clear the SimplePie Cache if $force_refresh param is true.
		if ( true === $force_refresh ) {
			add_action( 'wp_feed_options', array( __CLASS__, 'reset_simplepie_cache' ) );
		}
		// Add action: detect the podcast feed from the provided feed URL.
		add_action( 'wp_feed_options', array( __CLASS__, 'set_podcast_locator' ) );

		$cache_timeout_filter_added = false;
		if ( $this->cache_timeout !== null ) {
			// If we have a custom cache timeout, apply the custom timeout value.
			add_filter( 'wp_feed_cache_transient_lifetime', array( $this, 'filter_podcast_cache_timeout' ), 20 );
			$cache_timeout_filter_added = true;
		}

		/**
		 * Allow callers to set up any desired hooks when we fetch the content for a podcast.
		 * The `jetpack_podcast_post_fetch` action can be used to perform cleanup.
		 *
		 * @param string $podcast_url URL for the podcast's RSS feed.
		 *
		 * @since 11.2
		 */
		do_action( 'jetpack_podcast_pre_fetch', $this->feed );

		// Fetch the feed.
		$rss = fetch_feed( $this->feed );

		// Remove added actions from wp_feed_options hook.
		remove_action( 'wp_feed_options', array( __CLASS__, 'set_podcast_locator' ) );
		if ( true === $force_refresh ) {
			remove_action( 'wp_feed_options', array( __CLASS__, 'reset_simplepie_cache' ) );
		}

		if ( $cache_timeout_filter_added ) {
			// Remove the cache timeout filter we added.
			remove_filter( 'wp_feed_cache_transient_lifetime', array( $this, 'filter_podcast_cache_timeout' ), 20 );
		}

		/**
		 * Allow callers to identify when we have completed fetching a specified podcast feed.
		 * This makes it possible to clean up any actions or filters that were set up using the
		 * `jetpack_podcast_pre_fetch` action.
		 *
		 * Note that this action runs after other hooks added by Jetpack have been removed.
		 *
		 * @param string             $podcast_url URL for the podcast's RSS feed.
		 * @param SimplePie|WP_Error $rss Either the SimplePie RSS object or an error.
		 *
		 * @since 11.2
		 */
		do_action( 'jetpack_podcast_post_fetch', $this->feed, $rss );

		if ( is_wp_error( $rss ) ) {
			return new WP_Error( 'invalid_url', __( 'Your podcast couldn\'t be embedded. Please double check your URL.', 'jetpack' ) );
		}

		if ( ! $rss->get_item_quantity() ) {
			return new WP_Error( 'no_tracks', __( 'Podcast audio RSS feed has no tracks.', 'jetpack' ) );
		}

		return $rss;
	}

	/**
	 * Filter to override the default number of seconds to cache RSS feed data for the current feed.
	 * Note that we don't use the feed's URL because some of the SimplePie feed caches trigger this
	 * filter with a feed identifier and not a URL.
	 *
	 * @param int $cache_timeout_in_seconds Number of seconds to cache the podcast feed.
	 *
	 * @return int The number of seconds to cache the podcast feed.
	 */
	public function filter_podcast_cache_timeout( $cache_timeout_in_seconds ) {
		if ( $this->cache_timeout !== null ) {
			return $this->cache_timeout;
		}

		return $cache_timeout_in_seconds;
	}

	/**
	 * Action handler to set our podcast specific feed locator class on the SimplePie object.
	 *
	 * @param SimplePie $feed The SimplePie object, passed by reference.
	 */
	public static function set_podcast_locator( &$feed ) {
		if ( ! class_exists( 'Jetpack_Podcast_Feed_Locator' ) ) {
			require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-podcast-feed-locator.php';
		}

		$feed->set_locator_class( 'Jetpack_Podcast_Feed_Locator' );
	}

	/**
	 * Action handler to reset the SimplePie cache for the podcast feed.
	 *
	 * Note this only resets the cache for the specified url. If the feed locator finds the podcast feed
	 * within the markup of the that url, that feed itself may still be cached.
	 *
	 * @param SimplePie $feed The SimplePie object, passed by reference.
	 * @return void
	 */
	public static function reset_simplepie_cache( &$feed ) {
		// Retrieve the cache object for a feed url. Based on:
		// https://github.com/WordPress/WordPress/blob/fd1c2cb4011845ceb7244a062b09b2506082b1c9/wp-includes/class-simplepie.php#L1412.
		$cache = $feed->registry->call( 'Cache', 'get_handler', array( $feed->cache_location, call_user_func( $feed->cache_name_function, $feed->feed_url ), 'spc' ) );

		if ( method_exists( $cache, 'unlink' ) ) {
			$cache->unlink();
		}
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

		$publish_date = $episode->get_gmdate( DATE_ATOM );
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
			'publish_date'     => $publish_date ? $publish_date : null,
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
				'title'   => array(
					'description' => __( 'The title of the podcast.', 'jetpack' ),
					'type'        => 'string',
				),
				'link'    => array(
					'description' => __( 'The URL of the podcast website.', 'jetpack' ),
					'type'        => 'string',
					'format'      => 'uri',
				),
				'cover'   => array(
					'description' => __( 'The URL of the podcast cover image.', 'jetpack' ),
					'type'        => 'string',
					'format'      => 'uri',
				),
				'tracks'  => self::get_tracks_schema(),
				'options' => self::get_options_schema(),
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
					'publish_date'     => array(
						'description' => __( 'The UTC publish date and time of the episode', 'jetpack' ),
						'type'        => 'string',
						'format'      => 'date-time',
					),
				),
			),
		);
	}

	/**
	 * Gets the episode options schema.
	 *
	 * Useful for json schema in REST API endpoints.
	 *
	 * @return array Tracks json schema.
	 */
	public static function get_options_schema() {
		return array(
			'description' => __( 'The options that will be displayed in the episode selection UI', 'jetpack' ),
			'type'        => 'array',
			'items'       => array(
				'type'       => 'object',
				'properties' => array(
					'label' => array(
						'description' => __( 'The display label of the option, the episode title.', 'jetpack' ),
						'type'        => 'string',
					),
					'value' => array(
						'description' => __( 'The value used for that option, the episode GUID', 'jetpack' ),
						'type'        => 'string',
					),
				),
			),
		);
	}
}
