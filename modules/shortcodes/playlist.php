<?php

/**
 * Multi-song mp3 player
 */

class PlayerShortcode {

	static $add_script = false;

	public static function init() {
		// the shortcode always works: you need to have had the space upgrade
		// to ever upload mp3s in the first place
		add_shortcode( 'playlist', array( __CLASS__, 'shortcode') );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'check_infinite' ) );
		add_action( 'infinite_scroll_render', array( __CLASS__, 'playlist_shortcode_infinite' ), 11 );
	}

	public static function shortcode( $atts ) {
		$atts = shortcode_atts( array(
			'tracks' => '',
			'random' => 0
		), $atts );

		$ids = wp_parse_id_list( $atts['tracks'] );

		$attachments = get_posts( array(
			'post_type'      => 'attachment',
			'post_mime_type' => 'audio/mpeg',
			'post__in'       => $ids,
			'orderby'        => 'post__in',
			'posts_per_page' => 30
		) );

		if ( empty( $attachments ) )
			return '';

		$playlist = array();

		foreach ( $attachments as $attachment ) {
			$playlist[] = array(
				'free'  => false,
				'title' => $attachment->post_title,
				'mp3'   => $attachment->guid
			);
		}

		if ( is_home() && current_theme_supports( 'infinite-scroll' ) )
			self::$add_script = true;

		$music_player = new Music_Player( $playlist );

		if( (int) $atts['random'] == 1 )
			$music_player->randomize();

		return $music_player->render();
	}

	/**
	 * If the theme uses infinite scroll, include jquery at the start
	 */
	public static function check_infinite() {
		if ( current_theme_supports( 'infinite-scroll' ) && class_exists( 'The_Neverending_Home_Page' ) && The_Neverending_Home_Page::archive_supports_infinity() )
			wp_enqueue_script( 'jquery' );
	}

	/**
	 * Dynamically load the .js, if needed
	 *
	 * This hooks in late (priority 11) to infinite_scroll_render to determine
	 * a posteriori if a shortcode has been called.
	 */
	public static function playlist_shortcode_infinite() {
		// only try to load if a shortcode has been called and theme supports infinite scroll
		if( self::$add_script ) {
			$script_url = json_encode( esc_url_raw( plugins_url( 'js/playlist-shortcode.js', __FILE__ ) ) );

			// if the script hasn't been loaded, load it
			// if the script loads successfully, fire an 'pd-script-load' event
			echo <<<SCRIPT
				<script type='text/javascript'>
				//<![CDATA[
				if ( typeof window.playlistshortcode === 'undefined' ) {
					var wp_js = document.createElement( 'script' );
					wp_js.type = 'text/javascript';
					wp_js.src = $script_url;
					wp_js.async = true;
					wp_js.onload = function() {
						jQuery( document.body ).trigger( 'pl-script-load' );
					};
					document.getElementsByTagName( 'head' )[0].appendChild( wp_js );
				} else {
					jQuery( document.body ).trigger( 'pl-script-load' );
				}
				//]]>
				</script>
SCRIPT;

		}
	}
}

add_action( 'init', array( 'PlayerShortcode', 'init' ) );