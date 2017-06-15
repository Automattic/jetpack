<?php

require_once( AMP__ROOT__ . '/includes/embeds/class-amp-base-embed-handler.php' );

// Much of this class is borrowed from Jetpack embeds
class AMP_Twitter_Embed_Handler extends AMP_Base_Embed_Handler {
	const URL_PATTERN = '#http(s|):\/\/twitter\.com(\/\#\!\/|\/)([a-zA-Z0-9_]{1,20})\/status(es)*\/(\d+)#i';

	private static $script_slug = 'amp-twitter';
	private static $script_src = 'https://cdn.ampproject.org/v0/amp-twitter-0.1.js';

	public function register_embed() {
		add_shortcode( 'tweet', array( $this, 'shortcode' ) );
		wp_embed_register_handler( 'amp-twitter', self::URL_PATTERN, array( $this, 'oembed' ), -1 );
	}

	public function unregister_embed() {
		remove_shortcode( 'tweet' );
		wp_embed_unregister_handler( 'amp-twitter', -1 );
	}

	public function get_scripts() {
		if ( ! $this->did_convert_elements ) {
			return array();
		}

		return array( self::$script_slug => self::$script_src );
	}

	function shortcode( $attr ) {
		$attr = wp_parse_args( $attr, array(
			'tweet' => false,
		) );

		if ( empty( $attr['tweet'] ) && ! empty( $attr[0] ) ) {
			$attr['tweet'] = $attr[0];
		}

		$id = false;
		if ( is_numeric( $attr['tweet'] ) ) {
			$id = $attr['tweet'];
		} else {
			preg_match( self::URL_PATTERN, $attr['tweet'], $matches );
			if ( isset( $matches[5] ) && is_numeric( $matches[5] ) ) {
				$id = $matches[5];
			}

			if ( empty( $id ) ) {
				return '';
			}
		}

		$this->did_convert_elements = true;

		return AMP_HTML_Utils::build_tag(
			'amp-twitter',
			array(
				'data-tweetid' => $id,
				'layout' => 'responsive',
				'width' => $this->args['width'],
				'height' => $this->args['height'],
			)
		);
	}

	function oembed( $matches, $attr, $url, $rawattr ) {
		$id = false;

		if ( isset( $matches[5] ) && is_numeric( $matches[5] ) ) {
			$id = $matches[5];
		}

		if ( ! $id ) {
			return '';
		}

		return $this->shortcode( array( 'tweet' => $id ) );
	}
}
