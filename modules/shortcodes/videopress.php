<?php
/**
 * @package video
 * @category video
 * @author Automattic Inc
 * @link http://automattic.com/wordpress-plugins/#videopress VideoPress
 * @version 1.5
 * @license http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 */

/* 
Plugin Name: VideoPress
Plugin URI: http://wordpress.org/extend/plugins/video/
Description: Upload new videos to <a href="http://videopress.com/">VideoPress</a>, edit metadata, and easily insert VideoPress videos into posts and pages using shortcodes. Requires a <a href="http://wordpress.com/">WordPress.com</a> account and a WordPress.com blog with the <a href="http://en.wordpress.com/products/#videopress">VideoPress upgrade</a> to store and serve uploaded videos.
Author: Automattic, Niall Kennedy, Joseph Scott, Gary Pendergast
Contributor: Hailin Wu
Author URI: http://automattic.com/wordpress-plugins/#videopress
Version: 1.5
Stable tag: 1.5
License: GPL v2 - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 */

if ( ! class_exists( 'VideoPress' ) ):

/**
 * VideoPress main handler.
 * Attach actions and filters. Handle shortcodes. Add video button to rich text editor.
 * @since 1.3
 */
class VideoPress {
	/**
	 * Plugin version in PHP-addressable form
	 * @var string
	 * @since 1.3
	 */
	const version = '1.5';

	/**
	 * Minimum allowed width. We don't expect videos viewed below this width to be useful; we drop small values to help save publishers from themselves.
	 * @var int
	 * @since 1.3
	 */
	const min_width = 60;

	/**
	 * Remember if videopress.js and dependencies have already been loaded
	 * @var bool
	 * @since 1.5
	 */
	var $js_loaded;

	/**
	 * Remember all of the videos loaded on this page
	 * @var array
	 * @since 1.5
	 */
	var $shown;

	/**
	 *  Attach actions, filters, and shortcode handlers
	 * @since 1.3
	 */
	public function __construct() {
		/**
		 * json_decode should be initialized by compat.php. It's a PHP extension that might not be turned on, or could not be compatible with older version of PHP. We won't be able to unpack the server response without it, so let's fail early.
		 */
		if ( ! function_exists( 'json_decode' ) )
			return;

			add_action( 'wp_head', array( $this, 'html_head' ), -1 ); // load before enqueue_scripts action

		//allow either [videopress xyz] or [wpvideo xyz] for backward compatibility
		add_shortcode( 'videopress', array( $this, 'shortcode' ) );
		add_shortcode( 'wpvideo', array( $this, 'shortcode' ) );

		// set default values
		$this->js_loaded = false;
		$this->shown = array();
	}

	/**
	 * PHP 4 constructor compatibility
	 *
	 * @since 1.5
	 * @todo remove when targeting PHP 5 (WordPress 3.2 requirement) or above.
	 */
	public function VideoPress() {
		$this->__construct();
	}

	/**
	 * Validate user-supplied guid values against expected inputs
	 *
	 * @since 1.1
	 * @param string $guid video identifier
	 * @return bool true if passes validation test
	 */
	public static function is_valid_guid( $guid ) {
		if ( ! empty( $guid ) && strlen( $guid ) === 8 && ctype_alnum( $guid ) )
			return true;
		else
			return false;
	}

	/**
	 * Search a given content string for VideoPress shortcodes. Return an array of shortcodes with guid and attribute values.
	 *
	 * @since 1.2
	 * @see do_shortcode()
	 * @param string $content post content string
	 * @return array Array of shortcode data. GUID as the key and other customization parameters as value. empty array if no matches found.
	 */
	public static function find_all_shortcodes( $content ) {
		$r = preg_match_all( '/(.?)\[(wpvideo|videopress)\b(.*?)(?:(\/))?\](?:(.+?)\[\/\2\])?(.?)/s', $content, $matches, PREG_SET_ORDER );

		if ( $r === false || $r === 0 ) 
			return array();

		$guids = array();
		foreach ( $matches as $m ) {
			// allow [[foo]] syntax for escaping a tag
			if ( $m[1] === '[' && $m[6] === ']' )
				continue;
			$attr = shortcode_parse_atts( $m[3] );
			if ( self::is_valid_guid( $attr[0] ) ) {
				$guid = $attr[0];
				unset( $attr[0] );
				$guids[$guid] = $attr;
			}
		}

		return $guids;
	}


	/**
	 * Insert video handlers into HTML <head> if posts with video shortcodes exist.
	 * If video posts are present then queue VideoPress JavaScript files.
	 * If a video is present and is single post or page then add Open Graph protocol markup for first video found
	 *
	 * @since 1.3
	 */
	public function html_head() {
		if ( is_feed() || ! have_posts() )
			return;

		$guid = '';
		while ( have_posts() ) {
			the_post();
			$guids = self::find_all_shortcodes( get_the_content() );
			if ( ! empty( $guids ) ) {
				$guid = trim( key( $guids ) );
				break;
			}
			unset( $guids );
		}
		rewind_posts();

		if ( ! empty( $guid ) )
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ), 20 );
	}

	/**
	 * Add VideoPress JavaScript files to the script queue.
	 * A blog with the video_player_freedom option set to true may still require the VideoPress JS for stats purposes and therefore is not a reason for exclusion.
	 *
	 * @uses wp_enqueue_script()
	 * @since 1.3
	 * @return bool true if queued; else false
	 */
	public function enqueue_scripts() {
		if ( $this->js_loaded === true )
			return false;

		$jquery = '://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js';
		$swfobject = '://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js';
		if ( is_ssl() ) {
			$vpjs = 'https://v0.wordpress.com/js/videopress.js';
			$swfobject = 'https' . $swfobject;
			$jquery = 'https' . $jquery;
		} else {
			$vpjs = 'http://s0.videopress.com/js/videopress.js';
			$swfobject = 'http' . $swfobject;
			$jquery = 'http' . $jquery;
		}

		wp_enqueue_script( 'swfobject', $swfobject, false. '2.2' );
		wp_enqueue_script( 'jquery', $jquery, false, '1.4.4' );
		wp_enqueue_script( 'videopress', $vpjs, array( 'jquery','swfobject' ), '1.07' );
		
		$this->js_loaded = true;
		return true;
	}
	
	/**
	 * Print the VideoPress JS files now.
	 * Used to load the JS in the footer, if it hasn't already been loaded in the header.
	 *
	 * @uses wp_enqueue_script()
	 * @uses wp_print_scripts()
	 * @since 1.5
	 */
	public function print_scripts() {
		if ( $this->enqueue_scripts() === true )
			wp_print_scripts( array( 'swfobject', 'videopress' ) );
	}

	/**
	 * Translate a 'videopress' or 'wpvideo' shortcode and arguments into a video player display.
	 *
	 * @link http://codex.wordpress.org/Shortcode_API Shortcode API
	 * @param array $attr shortcode attributes
	 * @return string HTML markup or blank string on fail
	 */
	public function shortcode( $attr ) {
		global $content_width;

		$guid = $attr[0];
		if ( ! self::is_valid_guid( $guid ) )
			return '';
			
		if ( array_key_exists( $guid, $this->shown ) )
			$this->shown[$guid]++;
		else
			$this->shown[$guid] = 1;

		extract( shortcode_atts( array(
			'w' => 0,
			'freedom' => false,
			'flashonly' => false,
			'autoplay' => false
		), $attr ) );

		$freedom = (bool) $freedom;

		$width = absint($w);
		unset($w);

		if ( $width < self::min_width )
			$width = 0;
		elseif ( isset($content_width) && $content_width > self::min_width && $width > $content_width )
			$width = 0;

		if ( $width === 0 && isset( $content_width ) && $content_width > self::min_width )
			$width = $content_width;

		if ( ($width % 2) === 1 )
			$width--;

		$options = array(
			'freedom' => $freedom,
			'force_flash' => (bool) $flashonly,
			'autoplay' => (bool) $autoplay
		);
		unset( $freedom );
		unset( $flashonly );

		add_action( 'wp_footer', array( $this, 'print_scripts' ), -1 );

		$player = new VideoPress_Player( $guid, $width, $options );
		if ( $player instanceOf VideoPress_Player ) {
			if ( is_feed() )
				return $player->asXML();
			else
				return $player->asHTML();
		} else {
			return 'error';
		}
	}

	/**
	 * Add a video button above the post composition screen linking to a thickbox view of WordPress.com videos
	 *
	 * @since 0.1.0
	 */
	public function media_button() {
		echo '<a href="https://public-api.wordpress.com/videopress-plugin.php?page=video-plugin&amp;video_plugin=1&amp;iframe&amp;TB_iframe=true" id="add_video" class="thickbox" title="VideoPress"><img src="' . esc_url( plugins_url( ) . '/' . dirname( plugin_basename( __FILE__ ) ) . '/camera-video.png' ) . '" alt="VideoPress" width="16" height="16" /></a>';
	}
}

/**
 * VideoPress video object retrieved from VideoPress servers and parsed.
 * @since 1.3
 */
class VideoPress_Video {
	/**
	 * Manifest version returned by remote service.
	 *
	 * @var string
	 * @since 1.3
	 */
	const manifest_version = '1.5';

	/**
	 * Expiration of the video expressed in Unix time
	 *
	 * @var int
	 * @since 1.3
	 */
	public $expires;

	/**
	 * VideoPress unique identifier
	 *
	 * @var string
	 * @since 1.3
	 */
	public $guid;

	/**
	 * WordPress.com blog identifier
	 *
	 * @var int
	 * @since 1.5
	 */
	public $blog_id;

	/**
	 * Remote blog attachment identifier
	 *
	 * @var int
	 * @since 1.5
	 */
	public $post_id;

	/**
	 * Maximum desired width.
	 *
	 * @var int
	 * @since 1.3
	 */
	public $maxwidth;

	/**
	 * Video width calculated based on original video dimensions and the requested maxwidth
	 *
	 * @var int
	 * @since 1.3
	 */
	public $calculated_width;

	/**
	 * Video height calculated based on original video dimensions and the requested maxwidth
	 *
	 * @var int
	 * @since 1.3
	 */	
	public $calculated_height;

	/**
	 * Video title
	 *
	 * @var string
	 * @since 1.3
	 */
	public $title;

	/**
	 * Directionality of title text. ltr or rtl
	 *
	 * @var string
	 * @since 1.3
	 */
	public $text_direction;

	/**
	 * Text and audio language as ISO 639-2 language code
	 *
	 * @var string
	 * @since 1.3
	 */
	public $language;

	/**
	 * Video duration in whole seconds
	 *
	 * @var int
	 * @since 1.3
	 */
	public $duration;

	/**
	 * Recommended minimum age of the viewer.
	 *
	 * @var int
	 * @since 1.3
	 */
	public $age_rating;

	/**
	 * Video author has restricted video embedding or sharing
	 *
	 * @var bool
	 * @since 1.3
	 */
	public $restricted_embed;

	/**
	 * Poster frame image URI for the given video guid and calculated dimensions.
	 *
	 * @var string
	 * @since 1.3
	 */
	public $poster_frame_uri;

	/**
	 * Video files associated with the given guid for the calculated dimensions.
	 *
	 * @var stdClass
	 * @since 1.3
	 */
	public $videos;

	/**
	 * Video player information
	 *
	 * @var stdClass
	 * @since 1.3
	 */
	public $players;

	/**
	 * Video player skinning preferences including background color and watermark
	 *
	 * @var array
	 * @since 1.5
	 */
	public $skin;

	/**
	 * Closed captions if available for the given video. Associative array of ISO 639-2 language code and a WebVTT URI
	 *
	 * @var array
	 * @since 1.5
	 */
	public $captions;

	/**
	 * Setup the object.
	 * Request video information from VideoPress servers and process the response.
	 *
	 * @since 1.3
	 * @var string $guid VideoPress unique identifier
	 * @var int $maxwidth maximum requested video width. final width and height are calculated on VideoPress servers based on the aspect ratio of the original video upload.
	 */
	public function __construct( $guid, $maxwidth=0 ) {
		if ( VideoPress::is_valid_guid( $guid ) )
			$this->guid = $guid;

		$maxwidth = absint( $maxwidth );
		if ( $maxwidth > 0 )
			$this->maxwidth = $maxwidth;

		$data = $this->get_data();
		if ( is_wp_error( $data ) || empty( $data ) ) {
			$this->error = $data;
			return;
		}

		if ( isset( $data->blog_id ) )
			$this->blog_id = absint( $data->blog_id );

		if ( isset( $data->post_id ) )
			$this->post_id = absint( $data->post_id );

		if ( isset( $data->title ) && $data->title !== '' )
			$this->title = trim( str_replace( '&nbsp;', ' ', $data->title ) );

		if ( isset( $data->text_direction ) && $data->text_direction === 'rtl' )
			$this->text_direction = 'rtl';
		else
			$this->text_direction = 'ltr';

		if ( isset( $data->language ) )
			$this->language = $data->language;

		if ( isset( $data->duration ) && $data->duration > 0 )
			$this->duration = absint( $data->duration );

		if ( isset( $data->width ) && $data->width > 0 )
			$this->calculated_width = absint( $data->width );

		if ( isset( $data->height ) && $data->height > 0 )
			$this->calculated_height = absint( $data->height );

		if ( isset( $data->age_rating ) )
			$this->age_rating = absint( $this->age_rating );

		if ( isset( $data->restricted_embed ) && $data->restricted_embed === true )
			$this->restricted_embed = true;
		else
			$this->restricted_embed = false;

		if ( isset( $data->posterframe ) && $data->posterframe !== '' )
			$this->poster_frame_uri = esc_url_raw( $data->posterframe, array( 'http', 'https' ) );

		if ( isset( $data->mp4 ) || isset( $data->ogv ) ) {
			$this->videos = new stdClass();
			if ( isset( $data->mp4 ) )
				$this->videos->mp4 = $data->mp4;
			if ( isset( $data->ogv ) )
				$this->videos->ogv = $data->ogv;
		}

		if ( isset( $data->swf ) ) {
			if ( ! isset( $this->players ) )
				$this->players = new stdClass();
			$this->players->swf = $data->swf;
		}

		if ( isset( $data->skin ) )
			$this->skin = $data->skin;

		if ( isset( $data->captions ) )
			$this->captions = (array) $data->captions;
	}

	/**
	 * PHP 4 constructor compatibility
	 *
	 * @since 1.5
	 * @todo remove when targeting PHP 5 (WordPress 3.2 requirement) or above.
	 */
	public function VideoPress_Video( $guid, $maxwidth=0 ) {
		$this->__construct( $guid, $maxwidth );
	}

	/**
	 * Convert an Expires HTTP header value into Unix time for use in WP Cache
	 *
	 * @since 1.3
	 * @var string $expires_header
	 * @return int|bool Unix time or false
	 */
	public static function calculate_expiration( $expires_header ) {
		if ( empty( $expires_header ) || ! is_string( $expires_header ) )
			return false;

		if ( class_exists( 'DateTime' ) && class_exists( 'DateTimeZone' ) ) {
			$expires_date = DateTime::createFromFormat( 'D, d M Y H:i:s T', $expires_header, new DateTimeZone( 'UTC' ) );
			if ( $expires_date instanceOf DateTime )
				return date_format( $expires_date, 'U' );
		} else {
			$expires_array = strptime( $expires_header, '%a, %d %b %Y %H:%M:%S %Z' );
			if ( is_array( $expires_array ) && isset( $expires_array['tm_hour'] ) && isset( $expires_array['tm_min'] ) && isset( $expires_array['tm_sec'] ) && isset( $expires_array['tm_mon'] ) && isset( $expires_array['tm_mday'] ) && isset( $expires_array['tm_year'] ) )
				return gmmktime( $expires_array['tm_hour'], $expires_array['tm_min'], $expires_array['tm_sec'], 1 + $expires_array['tm_mon'], $expires_array['tm_mday'], 1900 + $expires_array['tm_year'] );
		}
		return false;
	}

	/**
	 * Extract the site's host domain for statistics and comparison against an allowed site list in the case of restricted embeds.
	 *
	 * @since 1.2
	 * @param string $url absolute URL
	 * @return bool|string host component of the URL, or false if none found
	 */
	public static function hostname( $url ) {
		if ( empty($url) || ! function_exists('parse_url') )
			return false;

		// PHP 5.3.3 or newer can throw a warning on a bad input URI. catch that occurance just in case
		try {
			return parse_url( $url, PHP_URL_HOST );
		} catch (Exception $e){}
		return false;
	}


	/**
	 * Request data from WordPress.com for the given guid, maxwidth, and calculated blog hostname.
	 *
	 * @since 1.3
	 * @return stdClass|WP_Error parsed JSON response or WP_Error if request unsuccessful
	 */
	private function get_data() {
		global $wp_version;

		$domain = self::hostname( home_url() );
		$request_params = array( 'guid' => $this->guid, 'domain' => $domain );
		if ( isset( $this->maxwidth ) && $this->maxwidth > 0 )
			$request_params['maxwidth'] = $this->maxwidth;

		$url = 'http://videopress.com/data/wordpress.json';
		if ( is_ssl() )
			$url = 'https://v.wordpress.com/data/wordpress.json';

		$response = wp_remote_get( $url . '?' . http_build_query( $request_params, null, '&' ), array(
			'httpversion' => '1.1',
			'redirection' => 1,
			'user-agent' => 'VideoPress plugin ' . VideoPress::version . '; WordPress ' . $wp_version . ' (' . home_url('/') . ')'
		) );
		unset( $request_params );
		unset( $url );
		$response_body = wp_remote_retrieve_body( $response );
		$response_code = absint( wp_remote_retrieve_response_code( $response ) );

		if ( is_wp_error( $response ) ) {
			return $response;
		} elseif ( $response_code === 400 ) {
			return new WP_Error( 'bad_config', __( 'The VideoPress plugin could not communicate with the VideoPress servers. This error is most likely caused by a misconfigured plugin. Please reinstall or upgrade.', 'jetpack' ) );
		} elseif ( $response_code === 403 ) {
			return new WP_Error( 'http_forbidden', '<p>' . sprintf( __( '<strong>%s</strong> is not an allowed embed site.' , 'jetpack' ), esc_html( $domain ) ) . '</p><p>' . __( 'Publisher limits playback of video embeds.', 'jetpack' ) . '</p>' );
		} elseif ( $response_code === 404 ) {
			return new WP_Error( 'http_not_found', '<p>' . sprintf( __( 'No data found for VideoPress identifier: <strong>%s</strong>.', 'jetpack' ), $this->guid ) . '</p>' );
		} elseif ( $response_code !== 200 || empty( $response_body ) ) {
			return;
		} else {
			$expires_header = wp_remote_retrieve_header( $response, 'Expires' );
			if ( ! empty( $expires_header ) ) {
				$expires = self::calculate_expiration( $expires_header );
				if ( ! empty( $expires ) )
					$this->expires = $expires;
			}
			return json_decode( $response_body );
		}
	}
}

/**
 * VideoPress playback module markup generator.
 *
 * @since 1.3
 */
class VideoPress_Player {
	/**
	 * Video data for the requested guid and maximum width
	 *
	 * @since 1.3
	 * @var VideoPress_Video
	 */
	protected $video;

	/**
	 * DOM identifier of the video container
	 *
	 * @var string
	 * @since 1.3
	 */
	protected $video_container_id;

	/**
	 * DOM identifier of the video element (video, object, embed)
	 *
	 * @var string
	 * @since 1.3
	 */
	protected $video_id;

	/**
	 * Array of playback options: force_flash or freedom
	 *
	 * @var array
	 * @since 1.3
	 */
	protected $options;

	/**
	 * Initiate a player object based on shortcode values and possible blog-level option overrides
	 *
	 * @since 1.3
	 * @var string $guid VideoPress unique identifier
	 * @var int $maxwidth maximum desired width of the video player if specified
	 * @var array $options player customizations
	 */
	public function __construct( $guid, $maxwidth = 0, $options = array() ) {
		global $videopress;
		$this->video_container_id = 'v-' . $guid . '-' . $videopress->shown[$guid];
		$this->video_id = $this->video_container_id . '-video';

		if ( is_array( $options ) )
			$this->options = $options;
		else
			$this->options = array();

		// set up the video
		$cache_key = null;

		// disable cache in debug mode
		if ( defined('WP_DEBUG') && WP_DEBUG === true ) {
			$cached_video = null;
		} else {
			$cache_key_pieces = array( 'video' );
			if ( is_multisite() && is_subdomain_install() ) {
				/**
				 * Compatibility wrapper for less than WordPress 3.1
				 *
				 * @todo remove when targeting WordPress 3.2 or above.
				 */
				if ( function_exists( 'get_current_blog_id' ) )
					$cache_key_pieces[] = get_current_blog_id();
				elseif ( isset( $GLOBALS ) && isset( $GLOBALS['blog_id'] ) )
					$cache_key_pieces[] = absint( $GLOBALS['blog_id'] );
				else
					$cache_key_pieces[] = 1;
			}
			$cache_key_pieces[] = $guid;
			if ( $width > 0 )
				$cache_key_pieces[] = $maxwidth;
			if ( is_ssl() )
				$cache_key_pieces[] = 'ssl';
			$cache_key = implode( '-', $cache_key_pieces );
			unset( $cache_key_pieces );
			$cached_video = wp_cache_get( $cache_key, 'video' );
		}
		if ( empty( $cached_video ) ) {
			$video = new VideoPress_Video( $guid, $maxwidth );
			if ( empty( $video ) ) {
				return;
			} elseif ( isset( $video->error ) ) {
				$this->video = $video->error;
				return;
			} elseif ( is_wp_error( $video ) ) {
				$this->video = $video;
				return;
			}

			$this->video = $video;
			unset( $video );

			if ( ! defined( 'WP_DEBUG' ) || WP_DEBUG !== true ) {
				$expire = 3600;
				if ( isset( $video->expires ) && is_int( $video->expires ) ) {
					$expires_diff = time() - $video->expires;
					if ( $expires_diff > 0 && $expires_diff < 86400 ) // allowed range: 1 second to 1 day
						$expire = $expires_diff;
					unset( $expires_diff );
				}

				wp_cache_set( $cache_key, serialize($this->video), 'video', $expire );
				unset( $expire );
			}
		} else {
			$this->video = unserialize( $cached_video );
		}
		unset( $cache_key );
		unset( $cached_video );
	}

	/**
	 * PHP 4 constructor compatibility
	 *
	 * @since 1.5
	 * @todo remove when targeting PHP 5 (WordPress 3.2 min requirement) or above.
	 */
	public function VideoPress_Player( $guid, $maxwidth = 0, $options = array() ) {
		$this->__construct( $guid, $maxwidth, $options );
	}

	/**
	 * Wrap output in a VideoPress player container
	 *
	 * @since 1.3
	 * @var string $content HTML string
	 * @return string HTML string or blank string if nothing to wrap
	 */
	private function html_wrapper( $content ) {
		if ( empty( $content ) )
			return '';
		else
			return '<div id="' . esc_attr( $this->video_container_id ) . '" class="video-player">' . $content . '</div>';
	}

	/**
	 * Output content suitable for a feed reader displaying RSS or Atom feeds
	 * We do not display error messages in the feed view due to caching concerns.
	 * Flash content presented using <embed> markup for feed reader compatibility.
	 *
	 * @since 1.3
	 * @return string HTML string or empty string if error
	 */
	public function asXML() {
		if ( empty( $this->video ) || is_wp_error( $this->video ) )
			return '';
		
		if ( isset( $this->options['freedom'] ) && $this->options['freedom'] === true )
			$content = $this->html5_static();
		else
			$content = $this->flash_embed();

		return $this->html_wrapper( $content );
	}

	/**
	 * Video player markup for best matching the current request and publisher options
	 * @since 1.3
	 * @return string HTML markup string or empty string if no video property found
	 */
	public function asHTML() {
		if ( empty( $this->video ) ) {
			$content = '';
		} elseif ( is_wp_error( $this->video ) ) {
			$content = $this->error_message( $this->video );
		} elseif ( ( isset( $this->video->restricted_embed ) && $this->video->restricted_embed === true ) || ( isset( $this->options['force_flash'] ) && $this->options['force_flash'] === true ) ) {
			$content = $this->flash_object();
		} elseif ( isset( $this->options['freedom'] ) && $this->options['freedom'] === true ) {
			$content = $this->html5_static();
		} elseif ( ! in_the_loop() ) {
			$content = $this->flash_object();
		} else {
			$content = $this->html5_dynamic();
		}
		return $this->html_wrapper( $content );
	}

	/**
	 * Display an error message to users capable of doing something about the error
	 *
	 * @since 1.3
	 * @uses current_user_can() to test if current user has edit_posts capability
	 * @var WP_Error $error WordPress error
	 * @return string HTML string
	 */
	private function error_message( $error ) {
		if ( ! current_user_can( 'edit_posts' ) || empty( $error ) )
			return '';

		$html = '<div class="videopress-error" style="background-color:rgb(255,0,0);color:rgb(255,255,255);font-family:font-family:\'Helvetica Neue\',Arial,Helvetica,\'Nimbus Sans L\',sans-serif;font-size:140%;min-height:10em;padding-top:1.5em;padding-bottom:1.5em">';
		$html .= '<h1 style="font-size:180%;font-style:bold;line-height:130%;text-decoration:underline">' . esc_html( sprintf( __( '%s Error', 'jetpack' ), 'VideoPress' ) ) . '</h1>';
		foreach( $error->get_error_messages() as $message ) {
			$html .= $message;
		}
		$html .= '</div>';
		return $html;
	}

	/**
	 * Rating agencies and industry associations require a potential viewer verify his or her age before a video or its poster frame are displayed.
	 * Content rated for audiences 17 years of age or older requires such verification across multiple rating agencies and industry associations
	 *
	 * @since 1.3
	 * @return bool true if video requires the viewer verify he or she is 17 years of age or older
	 */
	private function age_gate_required() {
		if ( isset( $this->video->age_rating ) && $this->video->age_rating >= 17 )
			return true;
		else
			return false;
	}

	/**
	 * Select a date of birth using HTML form elements.
	 *
	 * @since 1.5
	 * @return string HTML markup
	 */
	private function html_age_gate() {
		$text_align = 'left';
		if ( $this->video->text_direction === 'rtl' )
			$text_align = 'right';

		$html = '<div class="videopress-age-gate" style="margin:0 60px">';
		$html .= '<p class="instructions" style="color:rgb(255, 255, 255);font-size:21px;padding-top:60px;padding-bottom:20px;text-align:' . $text_align . '">' . esc_html( __( 'This video is intended for mature audiences.', 'jetpack' ) ) . '<br />' . esc_html( __( 'Please verify your birthday.', 'jetpack' ) ) . '</p>';
		$html .= '<fieldset id="birthday" style="border:0 none;text-align:' . $text_align . ';padding:0;">';
		$inputs_style = 'border:1px solid #444;margin-';
		if ( $this->video->text_direction === 'rtl' )
			$inputs_style .= 'left';
		else
			$inputs_style .= 'right';
		$inputs_style .= ':10px;background-color:rgb(0, 0, 0);font-size:14px;color:rgb(255,255,255);padding:4px 6px;line-height: 2em;vertical-align: middle';

		/**
		 * Display a list of months in the Gregorian calendar.
		 * Set values to 0-based to match JavaScript Date.
		 * @link https://developer.mozilla.org/en/JavaScript/Reference/global_objects/date Mozilla JavaScript Reference: Date
		 */
		$html .= '<select name="month" style="' . $inputs_style . '">';
		
		$months = array( __('January', 'jetpack'), __('February', 'jetpack'), __('March', 'jetpack'), __('April', 'jetpack'), __('May', 'jetpack'), __('June', 'jetpack'), __('July', 'jetpack'), __('August', 'jetpack'), __('September', 'jetpack'), __('October', 'jetpack'), __('November', 'jetpack'), __('December', 'jetpack') );
		for( $i=0; $i<12; $i++ ) {
			$html .= '<option value="' . esc_attr( $i ) . '">' . esc_html( $months[$i] )  . '</option>';
		}
		$html .= '</select>';
		unset( $months );

		/**
		 * todo: numdays variance by month
		 */
		$html .= '<select name="day" style="' . $inputs_style . '">';
		for ( $i=1; $i<32; $i++ ) {
			$html .= '<option>' . $i . '</option>';
		}
		$html .= '</select>';

		/**
		 * Current record for human life is 122. Go back 130 years and no one is left out.
		 * Don't ask infants younger than 2 for their birthday
		 * Default to 13
		 */
		$html .= '<select name="year" style="' . $inputs_style . '">';
		$start_year = date('Y') - 2;
		$default_year = $start_year - 11;
		$end_year = $start_year - 128;
		for ( $year=$start_year; $year>$end_year; $year-- ) {
			$html .= '<option';
			if ( $year === $default_year )
				$html .= ' selected="selected"';
			$html .= '>' . $year . '</option>';
		}
		unset( $start_year );
		unset( $default_year );
		unset( $end_year );
		$html .= '</select>';

		$html .= '<input type="submit" value="' . __( 'Submit', 'jetpack' ) . '" style="cursor:pointer;border-radius: 1em;border:1px solid #333;background-color:#333;background:-webkit-gradient( linear, left top, left bottom, color-stop(0.0, #444), color-stop(1, #111) );background:-moz-linear-gradient(center top, #444 0%, #111 100%);font-size:13px;padding:4px 10px 5px;line-height:1em;vertical-align:top;color:white;text-decoration:none;margin:0" />';

		$html .= '</fieldset>';
		$html .= '<p style="padding-top:20px;padding-bottom:60px;text-align:' . $text_align . ';"><a rel="nofollow" href="http://videopress.com/" style="color:rgb(128,128,128);text-decoration:underline;font-size:15px">' . __( 'More information', 'jetpack' ) . '</a></p>';

		$html .= '</div>';
		return $html;
	}

	/**
	 * Return HTML5 video static markup for the given video parameters.
	 * Use default browser player controls.
	 * No Flash fallback.
	 *
	 * @since 1.2
	 * @link http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html HTML5 video
	 * @return string HTML5 video element and children
	 */
	private function html5_static() {
		$thumbnail = esc_url( $this->video->poster_frame_uri );
		$html = "<video id=\"{$this->video_id}\" width=\"{$this->video->calculated_width}\" height=\"{$this->video->calculated_height}\" poster=\"$thumbnail\" controls=\"true\"";
		if ( isset( $this->options['autoplay'] ) && $this->options['autoplay'] === true )
			$html .= ' autoplay="true"';
		else
			$html .= ' preload="metadata"';
		if ( isset( $this->video->text_direction ) )
			$html .= ' dir="' . esc_attr( $this->video->text_direction ) . '"';
		if ( isset( $this->video->language ) )
			$html .= ' lang="' . esc_attr( $this->video->language ) . '"';
		$html .= '>';
		if ( ! isset( $this->options['freedom'] ) || $this->options['freedom'] === false ) {
			$mp4 = $this->video->videos->mp4->url;
			if ( ! empty( $mp4 ) )
				$html .= '<source src="' . esc_url( $mp4 ) . '" type="video/mp4; codecs=&quot;' . esc_attr( $this->video->videos->mp4->codecs ) . '&quot;" />';
			unset( $mp4 );
		}
		$ogg = $this->video->videos->ogv->url;
		if ( ! empty( $ogg ) )
			$html .= '<source src="' . esc_url( $ogg ) . '" type="video/ogg; codecs=&quot;' . esc_attr( $this->video->videos->ogv->codecs ) . '&quot;" />';
		unset( $ogg );

		$html .= '<div><img alt="';
		if ( isset( $this->video->title ) )
			$html .= esc_attr( $this->video->title );
		$html .= '" src="' . $thumbnail . '" width="' . $this->video->calculated_width . '" height="' . $this->video->calculated_height . '" /></div>';
		if ( isset( $this->options['freedom'] ) && $this->options['freedom'] === true )
			$html .= '<p class="robots-nocontent">' . sprintf( __( 'You do not have sufficient <a rel="nofollow" href="%s">freedom levels</a> to view this video. Support free software and upgrade.', 'jetpack' ), 'http://www.gnu.org/philosophy/free-sw.html' ) . '</p>';
		elseif ( isset( $this->video->title ) )
			$html .= '<p>' . esc_html( $this->video->title ) . '</p>';
		$html .= '</video>';
		return $html;
	}

	/**
	 * Click to play dynamic HTML5-capable player.
	 * The player displays a video preview section including poster frame, video title, play button and watermark on the original page load and calculates the playback capabilities of the browser. The video player is loaded when the visitor clicks on the video preview area.
	 * If Flash Player 10 or above is available the browser will display the Flash version of the video. If HTML5 video appears to be supported and the browser may be capable of MP4 (H.264, AAC) or OGV (Theora, Vorbis) playback the browser will display its native HTML5 player.
	 *
	 * @since 1.5
	 * @return string HTML markup
	 */
	private function html5_dynamic() {
		global $videopress;

		$video_placeholder_id = $this->video_container_id . '-placeholder';
		$age_gate_required = $this->age_gate_required();
		$width = absint( $this->video->calculated_width );
		$height = absint( $this->video->calculated_height );

		$html = '<div id="' . $video_placeholder_id . '" class="videopress-placeholder" style="';
		if ( $age_gate_required )
			$html .= "min-width:{$width}px;min-height:{$height}px";
		else
			$html .= "width:{$width}px;height:{$height}px";
		$html .= ';display:none;cursor:pointer !important;position:relative;';
		if ( isset( $this->video->skin ) && isset( $this->video->skin->background_color ) )
			$html .= 'background-color:' . esc_attr( $this->video->skin->background_color ) . ';';
		$html .= 'font-family: \'Helvetica Neue\',Arial,Helvetica,\'Nimbus Sans L\',sans-serif;font-weight:bold;font-size:18px">' . PHP_EOL;

		/**
		 * Do not display a poster frame, title, or any other content hints for mature content.
		 */
		if ( ! $age_gate_required ) {
			if ( ! empty( $this->video->title ) ) {
				$html .= '<div class="videopress-title" style="display:inline;position:absolute;margin:20px 20px 0 20px;padding:4px 8px;vertical-align:top;text-align:';
				if ( $this->video->text_direction === 'rtl' )
					$html .= 'right" dir="rtl"';
				else
					$html .= 'left" dir="ltr"';
				if ( isset( $this->video->language ) )
					$html .= ' lang="' . esc_attr( $this->video->language ) . '"';
				$html .= '><span style="padding:3px 0;line-height:1.5em;';
				if ( isset( $this->video->skin ) && isset( $this->video->skin->background_color ) ) {
					$html .= 'background-color:';
					if ( $this->video->skin->background_color === 'rgb(0,0,0)' )
						$html .= 'rgba(0,0,0,0.8)';
					else
						$html .= esc_attr( $this->video->skin->background_color );
					$html .= ';';
				}
				$html .= 'color:rgb(255,255,255)">' . esc_html( $this->video->title ) . '</span></div>';
			}
			$html .= '<img class="videopress-poster" alt="';
			if ( ! empty( $this->video->title ) )
				$html .= esc_attr( $this->video->title ) . '" title="' . esc_attr( sprintf( _x( 'Watch: %s', 'watch a video title', 'jetpack' ), $this->video->title ) );
			$html .= '" src="' . esc_url( $this->video->poster_frame_uri, array( 'http', 'https' ) ) . '" width=' . $width . '" height="' . $height . '" />' . PHP_EOL;

			//style a play button hovered over the poster frame
			$html .= '<div class="play-button"><span style="z-index:2;display:block;position:absolute;top:50%;left:50%;text-align:center;vertical-align:middle;color:rgb(255,255,255);opacity:0.9;margin:0 0 0 -0.45em;padding:0;line-height:0;font-size:500%;text-shadow:0 0 40px rgba(0,0,0,0.5)">&#9654;</span></div>' . PHP_EOL;

			// watermark
			if ( isset( $this->video->skin ) && isset( $this->video->skin->watermark ) ) {
				$html .= '<div style="position:relative;margin-top:-40px;height:25px;margin-bottom:35px;';
				if ( $this->video->text_direction === 'rtl' )
					$html .= 'margin-left:20px;text-align:left;';
				else
					$html .= 'margin-right:20px;text-align:right;';
				$html .= 'vertical-align:bottom;z-index:3">';
				$html .= '<img alt="" src="' . esc_url( $this->video->skin->watermark, array( 'http', 'https' ) ) . '" width="90" height="13" style="background-color:transparent;background-image:none;background-repeat:no-repeat;border:none;margin:0;padding:0"/>';
				$html .= '</div>' . PHP_EOL;
			}
		}

		$data = array(
			'blog' => absint( $this->video->blog_id ),
			'post' => absint( $this->video->post_id ),
			'duration'=> absint( $this->video->duration ),
			'poster' => esc_url_raw( $this->video->poster_frame_uri, array( 'http', 'https' ) )
		);
		if ( isset( $this->video->videos ) ) {
			if ( isset( $this->video->videos->mp4 ) && isset( $this->video->videos->mp4->url ) )
				$data['mp4'] = array( 'size' => $this->video->videos->mp4->format, 'uri' => esc_url_raw( $this->video->videos->mp4->url, array( 'http', 'https' ) ) );
			if ( isset( $this->video->videos->ogv ) && isset( $this->video->videos->ogv->url ) )
				$data['ogv'] = array( 'size' => 'std', 'uri' => esc_url_raw( $this->video->videos->ogv->url, array( 'http', 'https' ) ) );
		}
		$locale = array( 'dir' => $this->video->text_direction );
		if ( isset( $this->video->language ) )
			$locale['lang'] = $this->video->language;
		$data['locale'] = $locale;
		unset( $locale );

		$guid = $this->video->guid;
		$guid_js = json_encode( $guid );
		$html .= '<script type="text/javascript">' . PHP_EOL;
		
		// Only need to wait until document is ready if the JS is being loaded in the footer
		if ( ! $videopress->js_loaded )
			$html .= 'jQuery(document).ready(function() {';

		$html .= 'if ( !jQuery.VideoPress.data[' . json_encode($guid) . '] ) { jQuery.VideoPress.data[' . json_encode($guid) . '] = new Array(); }' . PHP_EOL;
		$html .= 'jQuery.VideoPress.data[' . json_encode( $guid ) . '][' . $videopress->shown[$guid] . ']=' . json_encode($data) . ';' . PHP_EOL;
		unset( $data );

		$jq_container = json_encode( '#' . $this->video_container_id );
		$jq_placeholder = json_encode( '#' . $video_placeholder_id );
		$player_config = "{width:{$width},height:{$height},";
		if ( isset( $this->options['freedom'] ) && $this->options['freedom'] === true )
			$player_config .= 'freedom:"true",';
		$player_config .= 'container:jQuery(' . $jq_container . ')}';

		$html .= "jQuery({$jq_placeholder}).show(0,function(){jQuery.VideoPress.analytics.impression({$guid_js})});" . PHP_EOL;

		if ( $age_gate_required ) {
			$html .= 'if ( jQuery.VideoPress.support.flash() ) {' . PHP_EOL;
			/**
			 * @link http://code.google.com/p/swfobject/wiki/api#swfobject.embedSWF(swfUrlStr,_replaceElemIdStr,_widthStr,_height
			 */
			$html .= 'swfobject.embedSWF(' . implode( ',', array(
				'jQuery.VideoPress.video.flash.player_uri',
				json_encode( $this->video_container_id ),
				json_encode( $width ),
				json_encode( $height ),
				'jQuery.VideoPress.video.flash.min_version',
				'jQuery.VideoPress.video.flash.expressinstall', // attempt to upgrade the Flash player if less than min_version. requires a 310x137 container or larger but we will always try to include
				'{guid:' . $guid_js . '}', // FlashVars
				'jQuery.VideoPress.video.flash.params',
				'null', // no attributes
				'jQuery.VideoPress.video.flash.embedCallback' // error fallback
			) ) . ');';
			$html .= '} else {' . PHP_EOL;
			$html .= "if ( jQuery.VideoPress.video.prepare({$guid_js},{$player_config}," . $videopress->shown[$guid] . ') ) {' . PHP_EOL;
			$html .= 'if ( jQuery(' . $jq_container . ').data( "player" ) === "flash" ){jQuery.VideoPress.video.play(jQuery(' . json_encode('#' . $this->video_container_id) . '));}else{';
			$html .= 'jQuery(' . $jq_placeholder . ').html(' . json_encode( $this->html_age_date() ) . ');' . PHP_EOL;
			$html .= 'jQuery(' . json_encode( '#' . $video_placeholder_id . ' input[type=submit]' ) . ').one("click", function(event){jQuery.VideoPress.requirements.isSufficientAge(jQuery(' . $jq_container . '),' . absint( $this->video->age_rating ) . ')});' . PHP_EOL;
			$html .= '}}}' . PHP_EOL;
		} else {
			$html .= "if ( jQuery.VideoPress.video.prepare({$guid_js}, {$player_config}," . $videopress->shown[$guid] . ') ) {' . PHP_EOL;
			if ( isset( $this->options['autoplay'] ) && $this->options['autoplay'] === true )
				$html .= "jQuery.VideoPress.video.play(jQuery({$jq_container}));";
			else
				$html .= 'jQuery(' . $jq_placeholder .  ').one("click",function(){jQuery.VideoPress.video.play(jQuery(' . $jq_container . '))});';
			$html .= '}';

			// close the jQuery(document).ready() function
			if ( !$videopress->js_loaded )
				$html .= '});';
		}
		$html .= '</script>' . PHP_EOL;
		$html .= '</div>' . PHP_EOL;

		/*
		 * JavaScript required
		 */
		$noun = __( 'this video', 'jetpack' );
		if ( ! $age_gate_required ) {
			$vid_type = '';
			if ( ( isset( $this->options['freedom'] ) && $this->options['freedom'] === true ) && ( isset( $this->video->videos->ogv ) && isset( $this->video->videos->ogv->url ) ) )
				$vid_type = 'ogv';
			elseif ( isset( $this->video->videos->mp4 ) && isset( $this->video->videos->mp4->url ) )
				$vid_type = 'mp4';
			elseif ( isset( $this->video->videos->ogv ) && isset( $this->video->videos->ogv->url ) )
				$vid_type = 'ogv';

			if ( $vid_type !== '' ) {
				$noun = '<a ';
				if ( isset( $this->video->language ) )
					$noun .= 'hreflang="' . esc_attr( $this->video->language ) . '" ';
				if ( $vid_type === 'mp4' )
					$noun .= 'type="video/mp4" href="' . esc_url( $this->video->videos->mp4->url, array( 'http', 'https' ) );
				elseif ( $vid_type === 'ogv' )
					$noun .= 'type="video/ogv" href="' . esc_url( $this->video->videos->ogv->url, array( 'http', 'https' ) );
				$noun .= '">';
				if ( isset( $this->video->title ) )
					$noun .= esc_html( $this->video->title );
				else
					$noun .= __( 'this video', 'jetpack' );
				$noun .= '</a>';
			} elseif ( ! empty( $this->title ) ) {
				$noun = esc_html( $this->title );
			}
			unset( $vid_type );
		}
		$html .= '<noscript><p>' . sprintf( _x( 'JavaScript required to play %s.', 'Play as in playback or view a movie', 'jetpack' ), $noun ) . '</p></noscript>';

		return $html;
	}

	/**
	 * Only allow legitimate Flash parameters and their values
	 *
	 * @since 1.2
	 * @link http://kb2.adobe.com/cps/127/tn_12701.html Flash object and embed attributes
	 * @link http://kb2.adobe.com/cps/133/tn_13331.html devicefont
	 * @link http://kb2.adobe.com/cps/164/tn_16494.html allowscriptaccess
	 * @link http://www.adobe.com/devnet/flashplayer/articles/full_screen_mode.html full screen mode
	 * @link http://livedocs.adobe.com/flash/9.0/main/wwhelp/wwhimpl/common/html/wwhelp.htm?context=LiveDocs_Parts&file=00001079.html allownetworking
	 * @param array $flash_params Flash parameters expressed in key-value form
	 * @return array validated Flash parameters
	 */
	public static function esc_flash_params( $flash_params ) {
		$allowed_params = array(
			'swliveconnect' => array('true', 'false'),
			'play' => array('true', 'false'),
			'loop' => array('true', 'false'),
			'menu' => array('true', 'false'),
			'quality' => array('low', 'autolow', 'autohigh', 'medium', 'high', 'best'),
			'scale' => array('default', 'noborder', 'exactfit', 'noscale'),
			'align' => array('l', 'r', 't'),
			'salign' => array('l', 'r', 't', 'tl', 'tr', 'bl', 'br'),
			'wmode' => array('window', 'opaque', 'transparent','direct','gpu'),
			'devicefont' => array('_sans', '_serif', '_typewriter'),
			'allowscriptaccess' => array('always', 'samedomain', 'never'),
			'allownetworking' => array('all','internal', 'none'),
			'seamlesstabbing' => array('true', 'false'),
			'allowfullscreen' => array('true', 'false'),
			'fullScreenAspectRatio' => array('portrait', 'landscape'),
			'base',
			'bgcolor',
			'flashvars'
		);

		$allowed_params_keys = array_keys( $allowed_params );

		$filtered_params = array();
		foreach( $flash_params as $param=>$value ) {
			if ( empty($param) || empty($value) )
				continue;
			$param = strtolower($param);
			if ( in_array($param, $allowed_params_keys) ) {
				if ( isset( $allowed_params[$param] ) && is_array( $allowed_params[$param] ) ) {
					$value = strtolower($value);
					if ( in_array( $value, $allowed_params[$param] ) )
						$filtered_params[$param] = $value;
				} else {
					$filtered_params[$param] = $value;
				}
			}
		}
		unset( $allowed_params_keys );

		/**
		 * Flash specifies sameDomain, not samedomain. change from lowercase value for preciseness
		 */
		if ( isset( $filtered_params['allowscriptaccess'] ) && $filtered_params['allowscriptaccess'] === 'samedomain' )
			$filtered_params['allowscriptaccess'] = 'sameDomain';

		return $filtered_params;
	}

	/**
	 * Filter Flash variables from the response, taking into consideration player options.
	 *
	 * @since 1.3
	 * @return array Flash variable key value pairs
	 */
	private function get_flash_variables() {
		if ( ! isset( $this->video->players->swf->vars ) )
			return array();

		$flashvars = (array) $this->video->players->swf->vars;
		if ( isset( $this->options['autoplay'] ) && $this->options['autoplay'] === true )
			$flashvars['autoPlay'] = 'true';
		return $flashvars;
	}

	/**
	 * Validate and filter Flash parameters
	 *
	 * @since 1.3
	 * @return array Flash parameters passed through key and value validation
	 */
	private function get_flash_parameters() {
		if ( ! isset( $this->video->players->swf->params ) )
			return array();
		else
			return self::esc_flash_params( apply_filters( 'video_flash_params', (array) $this->video->players->swf->params, 10, 1 ) );
	}

	/**
	 * Flash player markup in a HTML embed element.
	 *
	 * @since 1.1
	 * @link http://www.whatwg.org/specs/web-apps/current-work/multipage/the-iframe-element.html#the-embed-element embed element
	 * @link http://www.google.com/support/reader/bin/answer.py?answer=70664 Google Reader markup support
	 * @return string HTML markup. Embed element with no children
	 */
	private function flash_embed() {
		if ( ! isset( $this->video->players->swf ) || ! isset( $this->video->players->swf->url ) )
			return '';

		$embed = array(
			'id' => $this->video_id,
			'src' => esc_url_raw( $this->video->players->swf->url . '&' . http_build_query( $this->get_flash_variables(), null, '&' ) , array( 'http', 'https' ) ),
			'type' => 'application/x-shockwave-flash',
			'width' => $this->video->calculated_width,
			'height' => $this->video->calculated_height
		);
		if ( isset( $this->video->title ) )
			$embed['title'] = $this->video->title;
		$embed = array_merge( $embed, $this->get_flash_parameters() );

		$html = '<embed';
		foreach ( $embed as $attribute => $value ) {
			$html .= ' ' . esc_html( $attribute ) . '="' . esc_attr( $value ) . '"';
		}
		unset( $embed );
		$html .= '></embed>';
		return $html;
	}

	/**
	 * Double-baked Flash object markup for Internet Explorer and more standards-friendly consuming agents.
	 *
	 * @since 1.1
	 * @return HTML markup. Object and children.
	 */
	private function flash_object() {
		if ( ! isset( $this->video->players->swf ) || ! isset( $this->video->players->swf->url ) )
			return '';

		$thumbnail_html = '<img alt="';
		if ( isset( $this->video->title ) )
			$thumbnail_html .= esc_attr( $this->video->title );
		$thumbnail_html .= '" src="' . esc_url( $this->video->poster_frame_uri, array( 'http', 'https' ) ) . '" width="' . $this->video->calculated_width . '" height="' . $this->video->calculated_height . '" />';
		$flash_vars = esc_attr( http_build_query( $this->get_flash_variables(), null, '&' ) );
		$flash_params = '';
		foreach ( $this->get_flash_parameters() as $attribute => $value ) {
			$flash_params .= '<param name="' . esc_attr( $attribute ) . '" value="' . esc_attr( $value ) . '" />';
		}
		$flash_help = sprintf( __( 'This video requires <a rel="nofollow" href="%s">Adobe Flash</a> for playback.', 'jetpack' ), 'http://www.adobe.com/go/getflashplayer');
		$flash_player_url = esc_url( $this->video->players->swf->url, array( 'http', 'https' ) );
		$description = '';
		if ( isset( $this->video->title ) ) {
			$standby = $this->video->title;
			$description = '<p><strong>' . esc_html( $this->video->title ) . '</strong></p>';
		} else {
			$standby = __( 'Loading video...', 'jetpack' );
		}
		$standby = ' standby="' . esc_attr( $standby ) . '"';
		return <<<OBJECT
<script type="text/javascript">if(typeof swfobject!=="undefined"){swfobject.registerObject("{$this->video_id}", "{$this->video->players->swf->version}");}</script>
<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="{$this->video->calculated_width}" height="{$this->video->calculated_height}" id="{$this->video_id}"{$standby}>
  <param name="movie" value="{$flash_player_url}" />
  {$flash_params}
  <param name="flashvars" value="{$flash_vars}" />
  <!--[if !IE]>-->
  <object type="application/x-shockwave-flash" data="{$flash_player_url}" width="{$this->video->calculated_width}" height="{$this->video->calculated_height}"{$standby}>
    {$flash_params}
    <param name="flashvars" value="{$flash_vars}" />
  <!--<![endif]-->
  {$thumbnail_html}{$description}<p class="robots-nocontent">{$flash_help}</p>
  <!--[if !IE]>-->
  </object>
  <!--<![endif]-->
</object>
OBJECT;
	}
}

global $videopress;
$videopress = new VideoPress();

endif;
?>
