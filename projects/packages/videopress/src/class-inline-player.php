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
	const FACADE_CLASS      = 'jetpack-videopress-player__facade';

	/**
	 * How many placeholders this request has rendered; the first poster stays eager, later ones lazy-load.
	 *
	 * @var int
	 */
	private static $rendered = 0;

	/**
	 * Whether the boot script's config has been printed for this request.
	 *
	 * @var bool
	 */
	private static $config_printed = false;

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
		parse_str( html_entity_decode( $query, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 ), $params );

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
	 * Enqueue the boot script and, unless every player on the page sits behind a facade, the shared player assets.
	 *
	 * The boot script never depends on the player handle: behind a facade it fetches the
	 * bundle itself on the first click, from the URLs printed in its config.
	 *
	 * @param bool $defer_player True to leave the player bundle for the boot script to load on demand.
	 */
	public static function enqueue_assets( $defer_player = false ) {
		wp_enqueue_script(
			self::BOOT_HANDLE,
			plugins_url( '../build/lib/inline-player.js', __FILE__ ),
			array(),
			Package_Version::PACKAGE_VERSION,
			true
		);

		if ( ! self::$config_printed ) {
			self::$config_printed = true;
			wp_add_inline_script(
				self::BOOT_HANDLE,
				'window.jetpackVideoPressInlinePlayer = ' . wp_json_encode(
					array(
						'script' => add_query_arg( 'ver', Package_Version::PACKAGE_VERSION, self::PLAYER_SCRIPT_URL ),
						'style'  => add_query_arg( 'ver', Package_Version::PACKAGE_VERSION, self::PLAYER_STYLE_URL ),
					),
					JSON_UNESCAPED_SLASHES
				) . ';',
				'before'
			);
		}

		if ( ! $defer_player ) {
			wp_enqueue_style( self::PLAYER_HANDLE, self::PLAYER_STYLE_URL, array(), Package_Version::PACKAGE_VERSION );
			wp_enqueue_script( self::PLAYER_HANDLE, self::PLAYER_SCRIPT_URL, array(), Package_Version::PACKAGE_VERSION, true );
		}

		// Private videos ask the page for a playback token, same as iframes do.
		Jwt_Token_Bridge::enqueue_jwt_token_bridge();
	}

	/**
	 * Whether a placeholder should start as a poster facade instead of a mounted player.
	 *
	 * Autoplaying videos need the player at once; everything else can wait for a click.
	 *
	 * @param array $options Player options, see `get_player_options()`.
	 * @return bool
	 */
	public static function should_use_facade( array $options = array() ) {
		$use_facade = empty( $options['autoPlay'] );

		/**
		 * Filter whether inline VideoPress players start as a poster facade and load the player on click.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool  $use_facade Whether to render the facade.
		 * @param array $options    The player options for this video.
		 */
		return (bool) apply_filters( 'jetpack_videopress_inline_player_facade', $use_facade, $options );
	}

	/**
	 * Resolve the poster to show in a facade, without ever exposing a private video's frame.
	 *
	 * Order: the block's own poster attribute, the attachment's VideoPress metadata
	 * ( by `id`, else by GUID ), then the transient-cached video details lookup.
	 *
	 * @param string $guid       Video GUID.
	 * @param array  $attributes Block or shortcode attributes ( `poster`, `id`, `isPrivate`, `privacySetting` ).
	 * @return string|null Poster URL, or null when none is usable.
	 */
	public static function get_poster_url( $guid, array $attributes = array() ) {
		$poster = null;

		if ( ! empty( $attributes['poster'] ) && is_string( $attributes['poster'] ) ) {
			$poster = esc_url_raw( $attributes['poster'] );
		} elseif ( ! self::is_private( $attributes ) ) {
			$poster = self::get_poster_from_attachment( $guid, $attributes['id'] ?? 0 );

			if ( null === $poster && function_exists( 'videopress_get_video_details' ) ) {
				$details = videopress_get_video_details( $guid );
				if ( is_object( $details ) && empty( $details->is_private ) && ! empty( $details->poster ) && is_string( $details->poster ) ) {
					$poster = esc_url_raw( $details->poster );
				}
			}
		}

		/**
		 * Filter the poster shown by an inline VideoPress player's facade.
		 *
		 * @since $$next-version$$
		 *
		 * @param string|null $poster     Poster URL, or null for a plain dark facade.
		 * @param string      $guid       Video GUID.
		 * @param array       $attributes The block or shortcode attributes.
		 */
		$poster = apply_filters( 'jetpack_videopress_inline_player_poster', $poster, $guid, $attributes );

		return is_string( $poster ) && '' !== $poster ? $poster : null;
	}

	/**
	 * Whether the attributes describe a private video, treating "site default" as the site's own setting.
	 *
	 * @param array $attributes Block attributes.
	 * @return bool
	 */
	private static function is_private( array $attributes ) {
		if ( ! empty( $attributes['isPrivate'] ) ) {
			return true;
		}

		// A privacy setting of one is private and two follows the site default; anything else is public.
		$privacy = isset( $attributes['privacySetting'] ) ? (int) $attributes['privacySetting'] : 2;
		if ( 1 === $privacy ) {
			return true;
		}

		return 2 === $privacy && Data::get_videopress_videos_private_for_site();
	}

	/**
	 * Poster from the local attachment's VideoPress metadata, when the attachment belongs to this GUID.
	 *
	 * @param string $guid          Video GUID.
	 * @param int    $attachment_id Attachment ID from the block, 0 to look the post up by GUID.
	 * @return string|null
	 */
	private static function get_poster_from_attachment( $guid, $attachment_id = 0 ) {
		$attachment_id = (int) $attachment_id;

		if ( $attachment_id <= 0 && function_exists( 'videopress_get_post_by_guid' ) ) {
			$post          = videopress_get_post_by_guid( $guid );
			$attachment_id = ( $post instanceof \WP_Post ) ? $post->ID : 0;
		}

		if ( $attachment_id <= 0 ) {
			return null;
		}

		$meta       = wp_get_attachment_metadata( $attachment_id );
		$videopress = is_array( $meta ) && isset( $meta['videopress'] ) && is_array( $meta['videopress'] ) ? $meta['videopress'] : array();
		$poster     = $videopress['poster'] ?? '';
		$meta_guid  = $videopress['guid'] ?? '';

		if ( ! is_string( $poster ) || '' === $poster ) {
			return null;
		}

		// A block can point at another video than its attachment does; trust the GUID.
		if ( is_string( $meta_guid ) && '' !== $meta_guid && $meta_guid !== $guid ) {
			return null;
		}

		return esc_url_raw( $poster );
	}

	/**
	 * Stylesheet for the facade, printed inline so no extra request stands between the HTML and the poster.
	 *
	 * @return string CSS.
	 */
	private static function facade_css() {
		$f = '.' . self::FACADE_CLASS;
		return '.' . self::PLACEHOLDER_CLASS . '.is-facade{background:#000}'
			. $f . '{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;background:transparent;cursor:pointer;display:block;line-height:0}'
			. $f . '-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}'
			. $f . '-play{position:absolute;top:50%;left:50%;width:72px;height:72px;transform:translate(-50%,-50%);border-radius:50%;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;transition:background .2s ease}'
			. $f . ':hover ' . $f . '-play,' . $f . ':focus-visible ' . $f . '-play{background:rgba(0,0,0,.85)}'
			. $f . '-play svg{width:32px;height:32px;fill:#fff;margin-inline-start:4px}'
			. $f . ':focus-visible{outline:2px solid #fff;outline-offset:-4px}'
			. $f . '.is-loading ' . $f . '-play{opacity:.5}';
	}

	/**
	 * Render the placeholder the boot script mounts a player on.
	 *
	 * @param string     $guid    Video GUID.
	 * @param array      $options Player options, see `get_player_options()`.
	 * @param float|null $ratio   Height as a percentage of width (the block's `videoRatio`); 16:9 when unknown.
	 * @param array      $args    Optional `poster` ( URL ), `title` ( for the play button's label ) and `facade` ( bool, default `should_use_facade()` ).
	 * @return string Placeholder markup, or an empty string for an invalid GUID.
	 */
	public static function render( $guid, array $options = array(), $ratio = null, array $args = array() ) {
		if ( ! is_string( $guid ) || ! ctype_alnum( $guid ) ) {
			return '';
		}

		$facade = isset( $args['facade'] ) ? (bool) $args['facade'] : self::should_use_facade( $options );

		self::enqueue_assets( $facade );

		$ratio = is_numeric( $ratio ) && (float) $ratio > 0 ? (float) $ratio : 56.25;
		$style = sprintf(
			'position:relative;width:100%%;aspect-ratio:100 / %s;',
			rtrim( rtrim( number_format( $ratio, 4, '.', '' ), '0' ), '.' )
		);

		$inner = '';
		if ( $facade ) {
			wp_register_style( self::BOOT_HANDLE, false, array(), Package_Version::PACKAGE_VERSION );
			wp_enqueue_style( self::BOOT_HANDLE );
			if ( 0 === self::$rendered ) {
				wp_add_inline_style( self::BOOT_HANDLE, self::facade_css() );
			}

			$title = isset( $args['title'] ) && is_string( $args['title'] ) ? trim( $args['title'] ) : '';
			$label = '' !== $title
				/* translators: %s is the video title */
				? sprintf( __( 'Play video: %s', 'jetpack-videopress-pkg' ), $title )
				: __( 'Play video', 'jetpack-videopress-pkg' );

			$poster = '';
			if ( ! empty( $args['poster'] ) && is_string( $args['poster'] ) ) {
				// The first poster on the page is a likely LCP candidate; later ones can wait for the viewport.
				$poster = sprintf(
					'<img class="%1$s-poster" src="%2$s" alt="" decoding="async"%3$s>',
					esc_attr( self::FACADE_CLASS ),
					esc_url( $args['poster'] ),
					self::$rendered > 0 ? ' loading="lazy"' : ' fetchpriority="high"'
				);
			}

			$inner = sprintf(
				'<button type="button" class="%1$s" aria-label="%2$s">%3$s<span class="%1$s-play" aria-hidden="true"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z"/></svg></span></button>',
				esc_attr( self::FACADE_CLASS ),
				esc_attr( $label ),
				$poster
			);
		}

		++self::$rendered;

		return sprintf(
			'<div class="%1$s%5$s" data-videopress-guid="%2$s" data-videopress-options="%3$s"%6$s style="%4$s">%7$s</div>',
			esc_attr( self::PLACEHOLDER_CLASS ),
			esc_attr( $guid ),
			esc_attr( wp_json_encode( (object) $options, JSON_UNESCAPED_SLASHES ) ),
			esc_attr( $style ),
			$facade ? ' is-facade' : '',
			$facade ? ' data-videopress-facade="1"' : '',
			$inner
		);
	}

	/**
	 * Forget per-request state ( tests ).
	 */
	public static function reset() {
		self::$rendered       = 0;
		self::$config_printed = false;
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
