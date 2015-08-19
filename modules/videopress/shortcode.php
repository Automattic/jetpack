<?php
/**
 * VideoPress Shortcode Handler
 *
 * This file may or may not be included from the Jetpack VideoPress module.
 */
class Jetpack_VideoPress_Shortcode {
	public $min_width = 60;

	/**
	 * Singleton
	 */
	public static function init() {
		static $instance = false;

		if ( ! $instance )
			$instance = new Jetpack_VideoPress_Shortcode;

		return $instance;
	}

	function __construct() {
		add_shortcode( 'videopress', array( $this, 'shortcode_callback' ) );
		add_shortcode( 'wpvideo', array( $this, 'shortcode_callback' ) );
	}

	/**
	 * Translate a 'videopress' or 'wpvideo' shortcode and arguments into a video player display.
	 *
	 * @link http://codex.wordpress.org/Shortcode_API Shortcode API
	 * @param array $attr shortcode attributes
	 * @return string HTML markup or blank string on fail
	 */
	public function shortcode_callback( $attr, $content = '' ) {
		global $content_width;

		$guid = $attr[0];
		if ( ! $this->is_valid_guid( $guid ) )
			return '';

		$attr = shortcode_atts( array(
			'w' => 0,
			'h' => 0,
			'freedom' => false,
			'flashonly' => false,
			'autoplay' => false,
			'hd' => false,
			'permalink' => true,
			'loop' => false,
			'at' => 0,
			'defaultlangcode' => false,
		), $attr );

		$attr['forcestatic'] = false;

		$attr['freedom'] = (bool) $attr['freedom'];
		$attr['hd'] = (bool) $attr['hd'];
		$attr['width'] = absint( $attr['w'] );

		if ( $attr['width'] < $this->min_width )
			$attr['width'] = 0;
		elseif ( isset( $content_width ) && $content_width > $this->min_width && $attr['width'] > $content_width )
			$attr['width'] = 0;

		if ( $attr['width'] === 0 && isset( $content_width ) && $content_width > $this->min_width )
			$attr['width'] = $content_width;

		if ( ( $attr['width'] % 2 ) === 1 )
			$attr['width']--;

		/**
		 * Filter the default VideoPress shortcode options.
		 *
		 * @since 2.5.0
		 *
		 * @param array $args Array of VideoPress shortcode options.
		 */
		$options = apply_filters( 'videopress_shortcode_options', array(
			'freedom' => $attr['freedom'],
			'force_flash' => (bool) $attr['flashonly'],
			'autoplay' => $attr['autoplay'],
			'forcestatic' => $attr['forcestatic'],
			'hd' => $attr['hd'],
			'permalink' => $attr['permalink'],
			'loop' => $attr['autoplay'],
			'at' => (int) $attr['at'],
			'defaultlangcode' => $attr['defaultlangcode']
		) );

		// Enqueue VideoPress scripts
		self::register_scripts();

		require_once( dirname( __FILE__ ) . '/class.videopress-video.php' );
		require_once( dirname( __FILE__ ) . '/class.videopress-player.php' );

		$player = new VideoPress_Player( $guid, $attr['width'], $options );

		if ( is_feed() )
			return $player->asXML();
		else
			return $player->asHTML();
	}

	/**
	 * Validate user-supplied guid values against expected inputs
	 *
	 * @since 1.1
	 * @param string $guid video identifier
	 * @return bool true if passes validation test
	 */
	public function is_valid_guid( $guid ) {
		if ( ! empty( $guid ) && strlen( $guid ) === 8 && ctype_alnum( $guid ) )
			return true;
		else
			return false;
	}

	/**
	 * Register scripts needed to play VideoPress videos. One of the player methods will
	 * enqueue thoe script if needed.
	 *
	 * @uses is_ssl()
	 * @uses wp_register_script()
	 * @return null
	 */
	public static function register_scripts() {
		$js_url = ( is_ssl() ) ? 'https://v0.wordpress.com/js/videopress.js' : 'http://s0.videopress.com/js/videopress.js';
		wp_register_script( 'videopress', $js_url, array( 'jquery', 'swfobject' ), '1.09' );
	}

	/**
	 * Adds a `for` query parameter to the oembed provider request URL.
	 * @param String $oembed_provider
	 * @return String $ehnanced_oembed_provider
	 */
	public static function add_oembed_parameter( $oembed_provider ) {
		if ( false === stripos( $oembed_provider, 'videopress.com' ) ) {
			return $oembed_provider;
		}
		return add_query_arg( 'for', parse_url( home_url(), PHP_URL_HOST ), $oembed_provider );
	}
}

// Initialize the shortcode handler.
Jetpack_VideoPress_Shortcode::init();

wp_oembed_add_provider( '#^https?://videopress.com/v/.*#', 'http://public-api.wordpress.com/oembed/1.0/', true );

add_filter( 'oembed_fetch_url', 'Jetpack_VideoPress_Shortcode::add_oembed_parameter' );