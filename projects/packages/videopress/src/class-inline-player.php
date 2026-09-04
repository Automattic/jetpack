<?php
/**
 * Inline (non-iframe) VideoPress player rendering.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Renders VideoPress players in the page from one shared player script.
 *
 * Every `videopress.com/embed/` iframe downloads and runs its own copy of the
 * player, so a page pays for it once per video. In inline mode the player
 * bundle and stylesheet load once from v0.wordpress.com and a small boot
 * script mounts a player on each placeholder.
 */
class Inline_Player {

	const PLAYER_SCRIPT_URL = 'https://v0.wordpress.com/js/videojs/videopress.js';
	const PLAYER_STYLE_URL  = 'https://v0.wordpress.com/js/videojs/videopress.css';

	// The Jetpack plugin's legacy in-page embed used this handle; keep it so existing dequeue hooks still apply.
	const PLAYER_HANDLE = 'videopress-videojs';
	const BOOT_HANDLE   = 'videopress-inline-player';

	const PLACEHOLDER_CLASS = 'jetpack-videopress-player__inline';

	/**
	 * Whether embeds rendered by this site should mount an inline player instead of an iframe.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Filter whether VideoPress videos are embedded with an iframe.
		 *
		 * Return false to render the player directly in the page from one shared
		 * player script. Defaults to the inverse of the site's inline player setting.
		 *
		 * @module videopress
		 *
		 * @since 3.7.0
		 *
		 * @param bool $use_iframe Whether to embed with an iframe.
		 */
		return ! apply_filters( 'jetpack_videopress_player_use_iframe', ! Data::get_videopress_inline_player_enabled() );
	}

	/**
	 * Map block or shortcode attributes to player options.
	 *
	 * Accepts the video block's attribute names (`autoplay`, `preload`, ...);
	 * anything missing falls back to the player's defaults.
	 *
	 * @param array $attributes Attributes to map.
	 * @return array Player options, ready to pass to `videopress()`.
	 */
	public static function get_player_options( array $attributes = array() ) {
		$attributes = wp_parse_args(
			$attributes,
			array(
				'autoplay'            => false,
				'controls'            => true,
				'loop'                => false,
				'muted'               => false,
				'playsinline'         => false,
				'poster'              => '',
				'preload'             => 'metadata',
				'seekbarColor'        => '',
				'seekbarPlayedColor'  => '',
				'seekbarLoadingColor' => '',
				'useAverageColor'     => true,
				'cover'               => true,
				'hd'                  => false,
				'at'                  => 0,
				'defaultLangCode'     => '',
			)
		);

		$preload = is_string( $attributes['preload'] ) ? strtolower( $attributes['preload'] ) : 'metadata';
		if ( ! in_array( $preload, array( 'auto', 'metadata', 'none' ), true ) ) {
			$preload = 'metadata';
		}
		// The site-wide opt-out wins over the embed's own preload attribute.
		if ( Data::get_videopress_player_preload_disabled() ) {
			$preload = 'none';
		}

		$options = array(
			'autoPlay'        => self::to_bool( $attributes['autoplay'] ),
			'controls'        => self::to_bool( $attributes['controls'] ),
			'loop'            => self::to_bool( $attributes['loop'] ),
			'muted'           => self::to_bool( $attributes['muted'] ),
			'persistVolume'   => ! self::to_bool( $attributes['muted'] ),
			'playsinline'     => self::to_bool( $attributes['playsinline'] ),
			'cover'           => self::to_bool( $attributes['cover'] ),
			'hd'              => self::to_bool( $attributes['hd'] ),
			'useAverageColor' => self::to_bool( $attributes['useAverageColor'] ),
			'preloadContent'  => $preload,
			// Embed pages default to the current player skin; match them.
			'chrome'          => 'v2',
		);

		if ( (int) $attributes['at'] > 0 ) {
			$options['at'] = (int) $attributes['at'];
		}

		if ( ! empty( $attributes['poster'] ) && is_string( $attributes['poster'] ) ) {
			$options['poster'] = esc_url_raw( $attributes['poster'] );
		}

		if ( ! empty( $attributes['defaultLangCode'] ) && is_string( $attributes['defaultLangCode'] ) ) {
			$options['defaultLangCode'] = $attributes['defaultLangCode'];
		}

		$colors = array(
			'seekbarColor'        => 'seekbarColor',
			'seekbarPlayedColor'  => 'seekbarPlayedColor',
			'seekbarLoadingColor' => 'seekbarLoadedColor',
		);
		foreach ( $colors as $attribute => $option ) {
			if ( ! empty( $attributes[ $attribute ] ) && is_string( $attributes[ $attribute ] ) ) {
				$options[ $option ] = $attributes[ $attribute ];
			}
		}

		/**
		 * Filter the options passed to an inline VideoPress player.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $options    Player options.
		 * @param array $attributes The block or shortcode attributes they were built from.
		 */
		return apply_filters( 'jetpack_videopress_inline_player_options', $options, $attributes );
	}

	/**
	 * Read the player attributes an embed URL carries in its query string.
	 *
	 * Used to render inline players for videopress.com URLs that reach the
	 * page through oEmbed. Only parameters present in the URL are returned.
	 *
	 * @param string $url A videopress.com/v or /embed URL.
	 * @return array Attributes in the shape `get_player_options()` accepts.
	 */
	public static function get_attributes_from_embed_url( $url ) {
		$query = wp_parse_url( $url, PHP_URL_QUERY );
		if ( ! is_string( $query ) || '' === $query ) {
			return array();
		}

		$params = array();
		parse_str( html_entity_decode( $query ), $params );

		$booleans = array(
			'autoPlay'        => 'autoplay',
			'autoplay'        => 'autoplay',
			'controls'        => 'controls',
			'loop'            => 'loop',
			'muted'           => 'muted',
			'playsinline'     => 'playsinline',
			'useAverageColor' => 'useAverageColor',
			'cover'           => 'cover',
			'hd'              => 'hd',
		);
		$strings  = array(
			'posterUrl'       => 'poster',
			'preloadContent'  => 'preload',
			'sbc'             => 'seekbarColor',
			'sbpc'            => 'seekbarPlayedColor',
			'sblc'            => 'seekbarLoadingColor',
			'defaultLangCode' => 'defaultLangCode',
		);

		$attributes = array();
		foreach ( $booleans as $param => $attribute ) {
			if ( isset( $params[ $param ] ) && is_string( $params[ $param ] ) ) {
				$attributes[ $attribute ] = self::to_bool( $params[ $param ] );
			}
		}
		foreach ( $strings as $param => $attribute ) {
			if ( ! empty( $params[ $param ] ) && is_string( $params[ $param ] ) ) {
				$attributes[ $attribute ] = $params[ $param ];
			}
		}
		if ( isset( $params['at'] ) && (int) $params['at'] > 0 ) {
			$attributes['at'] = (int) $params['at'];
		}

		return $attributes;
	}

	/**
	 * Enqueue the shared player assets and the boot script, once per page.
	 */
	public static function enqueue_assets() {
		wp_enqueue_style( self::PLAYER_HANDLE, self::PLAYER_STYLE_URL, array(), Package_Version::PACKAGE_VERSION );
		wp_enqueue_script( self::PLAYER_HANDLE, self::PLAYER_SCRIPT_URL, array(), Package_Version::PACKAGE_VERSION, true );
		wp_enqueue_script(
			self::BOOT_HANDLE,
			plugins_url( '../build/lib/inline-player.js', __FILE__ ),
			array( self::PLAYER_HANDLE ),
			Package_Version::PACKAGE_VERSION,
			true
		);

		// Private videos ask the page for a playback token, same as iframes do.
		Jwt_Token_Bridge::enqueue_jwt_token_bridge();
	}

	/**
	 * Render the placeholder the boot script mounts a player on.
	 *
	 * @param string     $guid    Video GUID.
	 * @param array      $options Player options, see `get_player_options()`.
	 * @param float|null $ratio   Height as a percentage of width (the block's `videoRatio`); 16:9 when unknown.
	 * @return string Placeholder markup, or an empty string for an invalid GUID.
	 */
	public static function render( $guid, array $options = array(), $ratio = null ) {
		if ( ! is_string( $guid ) || ! ctype_alnum( $guid ) ) {
			return '';
		}

		self::enqueue_assets();

		$ratio = is_numeric( $ratio ) && (float) $ratio > 0 ? (float) $ratio : 56.25;
		$style = sprintf(
			'position:relative;width:100%%;aspect-ratio:100 / %s;',
			rtrim( rtrim( number_format( $ratio, 4, '.', '' ), '0' ), '.' )
		);

		return sprintf(
			'<div class="%1$s" data-videopress-guid="%2$s" data-videopress-options="%3$s" style="%4$s"></div>',
			esc_attr( self::PLACEHOLDER_CLASS ),
			esc_attr( $guid ),
			esc_attr( wp_json_encode( (object) $options, JSON_UNESCAPED_SLASHES ) ),
			esc_attr( $style )
		);
	}

	/**
	 * Interpret the boolean spellings that reach us from attributes and query strings.
	 *
	 * @param mixed $value Raw value.
	 * @return bool
	 */
	private static function to_bool( $value ) {
		if ( is_string( $value ) ) {
			return ! in_array( strtolower( $value ), array( '', '0', 'false', 'no', 'off' ), true );
		}
		return (bool) $value;
	}
}
