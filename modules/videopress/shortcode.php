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
			'freedom' => false,
			'flashonly' => false,
			'autoplay' => false,
			'hd' => false
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

		$options = apply_filters( 'videopress_shortcode_options', array(
			'freedom' => $attr['freedom'],
			'force_flash' => (bool) $attr['flashonly'],
			'autoplay' => (bool) $attr['autoplay'],
			'forcestatic' => $attr['forcestatic'],
			'hd' => (bool) $attr['hd']
		) );

		// Enqueue VideoPress scripts
		$js_url = ( is_ssl() ) ? 'https://v0.wordpress.com/js/videopress.js' : 'http://s0.videopress.com/js/videopress.js';
		wp_enqueue_script( 'videopress', $js_url, array( 'jquery', 'swfobject' ), '1.09' );

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
}

// Initialize the shortcode handler.
Jetpack_VideoPress_Shortcode::init();