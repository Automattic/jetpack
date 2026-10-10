<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
use Automattic\Jetpack\VideoPress\Inline_Player;
use Automattic\Jetpack\VideoPress\Jwt_Token_Bridge;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
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
	 * DOM identifier of the video element
	 *
	 * @var string
	 * @since 1.3
	 */
	protected $video_id;

	/**
	 * Array of playback options.
	 *
	 * @var array
	 * @since 1.3
	 */
	protected $options;

	/**
	 * Array of video GUIDs shown and their counts,
	 * moved from the old VideoPress class.
	 *
	 * @var array
	 */
	public static $shown = array();

	/**
	 * Fallback video title.
	 *
	 * @var ?string
	 */
	protected $title;

	/**
	 * Initiate a player object based on shortcode values and possible blog-level option overrides
	 *
	 * @since 1.3
	 * @param string $guid VideoPress unique identifier.
	 * @param int    $maxwidth Maximum desired width of the video player if specified.
	 * @param array  $options Player customizations.
	 */
	public function __construct( $guid, $maxwidth = 0, $options = array() ) {
		if ( empty( self::$shown[ $guid ] ) ) {
			self::$shown[ $guid ] = 0;
		}

		++self::$shown[ $guid ];

		$this->video_container_id = 'v-' . $guid . '-' . self::$shown[ $guid ];
		$this->video_id           = $this->video_container_id . '-video';

		if ( is_array( $options ) ) {
			$this->options = $options;
		} else {
			$this->options = array();
		}

		// set up the video
		$cache_key = null;

		// disable cache in debug mode
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG === true ) {
			$cached_video = null;
		} else {
			$cache_key_pieces = array( 'video' );

			if ( is_multisite() && is_subdomain_install() ) {
				$cache_key_pieces[] = get_current_blog_id();
			}

			$cache_key_pieces[] = $guid;
			if ( $maxwidth > 0 ) {
				$cache_key_pieces[] = $maxwidth;
			}
			if ( is_ssl() ) {
				$cache_key_pieces[] = 'ssl';
			}
			$cache_key = implode( '-', $cache_key_pieces );
			unset( $cache_key_pieces );
			$cached_video = wp_cache_get( $cache_key, 'video' );
		}
		if ( empty( $cached_video ) ) {
			$video = new VideoPress_Video( $guid, $maxwidth );
			if ( isset( $video->error ) ) {
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
				if ( isset( $this->video->expires ) && is_int( $this->video->expires ) ) {
					$expires_diff = time() - $this->video->expires;
					if ( $expires_diff > 0 && $expires_diff < 86400 ) { // allowed range: 1 second to 1 day
						$expire = $expires_diff;
					}
					unset( $expires_diff );
				}

				wp_cache_set( $cache_key, serialize( $this->video ), 'video', $expire ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
				unset( $expire );
			}
		} else {
			$this->video = unserialize( $cached_video ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize -- Make sure to unserialize as VideoPress_Video class.
		}
		unset( $cache_key );
		unset( $cached_video );
	}

	/**
	 * Wrap output in a VideoPress player container.
	 *
	 * @since 1.3
	 * @param string $content HTML string.
	 * @return string HTML string or blank string if nothing to wrap.
	 */
	private function html_wrapper( $content ) {
		if ( empty( $content ) ) {
			return '';
		} else {
			return '<div id="' . esc_attr( $this->video_container_id ) . '" class="video-player">' . $content . '</div>';
		}
	}

	/**
	 * Output content suitable for a feed reader displaying RSS or Atom feeds.
	 * We do not display error messages in the feed view due to caching concerns.
	 *
	 * @since 1.3
	 * @return string HTML string or empty string if error
	 */
	public function as_xml() {
		if ( empty( $this->video ) || is_wp_error( $this->video ) ) {
			return '';
		}

		return $this->html_wrapper( $this->html5_static() );
	}

	/**
	 * Video player markup for best matching the current request and publisher options
	 *
	 * @since 1.3
	 * @return string HTML markup string or empty string if no video property found
	 */
	public function as_html() {
		if ( empty( $this->video ) ) {
			$content = '';

		} elseif ( is_wp_error( $this->video ) ) {
			$content = $this->error_message( $this->video );

		} elseif ( isset( $this->video->restricted_embed ) && true === $this->video->restricted_embed ) {
			// Restricted videos always get the dynamic player, even with `freedom` set.
			$content = $this->html5_dynamic_next();

		} elseif ( isset( $this->options['freedom'] ) && true === $this->options['freedom'] ) {
			$content = $this->html5_static();

		} else {
			$content = $this->html5_dynamic_next();
		}

		return $this->html_wrapper( $content );
	}

	/**
	 * Display an error message to users capable of doing something about the error
	 *
	 * @since 1.3
	 * @uses current_user_can() to test if current user has edit_posts capability.
	 * @param WP_Error $error WordPress error.
	 * @return string HTML string
	 */
	private function error_message( $error ) {
		if ( ! current_user_can( 'edit_posts' ) || empty( $error ) ) {
			return '';
		}

		$html = '<div class="videopress-error" style="background-color:rgb(255,0,0);color:rgb(255,255,255);font-family:font-family:\'Helvetica Neue\',Arial,Helvetica,\'Nimbus Sans L\',sans-serif;font-size:140%;min-height:10em;padding-top:1.5em;padding-bottom:1.5em">';
		/* translators: %s is 'VideoPress' */
		$html .= '<h1 style="font-size:180%;font-style:bold;line-height:130%;text-decoration:underline">' . esc_html( sprintf( __( '%s Error', 'jetpack' ), 'VideoPress' ) ) . '</h1>';
		foreach ( $error->get_error_messages() as $message ) {
			$html .= $message;
		}
		$html .= '</div>';
		return $html;
	}

	/**
	 * Return HTML5 video static markup for the given video parameters.
	 * Use default browser player controls.
	 *
	 * @since 1.2
	 * @link https://html.spec.whatwg.org/multipage/media.html#the-video-element HTML5 video
	 * @return string HTML5 video element and children
	 */
	private function html5_static() {
		$thumbnail = esc_url( $this->video->poster_frame_uri );
		$html      = "<video id=\"{$this->video_id}\" width=\"{$this->video->calculated_width}\" height=\"{$this->video->calculated_height}\" poster=\"$thumbnail\" controls=\"true\"";

		$preload = 'metadata';
		if ( isset( $this->options['preloadContent'] ) && videopress_is_valid_preload( $this->options['preloadContent'] ) ) {
			$preload = $this->options['preloadContent'];
		}

		if ( isset( $this->options['autoplay'] ) && $this->options['autoplay'] === true ) {
			$html .= ' autoplay="true"';
		} else {
			$html .= ' preload="' . esc_attr( $preload ) . '"';
		}
		if ( isset( $this->video->text_direction ) ) {
			$html .= ' dir="' . esc_attr( $this->video->text_direction ) . '"';
		}
		if ( isset( $this->video->language ) ) {
			$html .= ' lang="' . esc_attr( $this->video->language ) . '"';
		}
		$html .= '>';
		if (
			( ! isset( $this->options['freedom'] ) || $this->options['freedom'] === false )
			&& isset( $this->video->videos->mp4 )
		) {
			$mp4 = $this->video->videos->mp4->url;
			if ( ! empty( $mp4 ) ) {
				$html .= '<source src="' . esc_url( $mp4 ) . '" type="video/mp4; codecs=&quot;' . esc_attr( $this->video->videos->mp4->codecs ) . '&quot;" />';
			}
			unset( $mp4 );
		}

		if ( isset( $this->video->videos->ogv ) ) {
			$ogg = $this->video->videos->ogv->url;
			if ( ! empty( $ogg ) ) {
				$html .= '<source src="' . esc_url( $ogg ) . '" type="video/ogg; codecs=&quot;' . esc_attr( $this->video->videos->ogv->codecs ) . '&quot;" />';
			}

			unset( $ogg );
		}

		$html .= '<div><img alt="';
		if ( isset( $this->video->title ) ) {
			$html .= esc_attr( $this->video->title );
		}
		$html .= '" src="' . $thumbnail . '" width="' . $this->video->calculated_width . '" height="' . $this->video->calculated_height . '" /></div>';
		if ( isset( $this->options['freedom'] ) && $this->options['freedom'] === true ) {
			/* translators: %s url to the gnu.org website */
			$html .= '<p class="robots-nocontent">' . sprintf( __( 'You do not have sufficient <a rel="nofollow noopener noreferrer" href="%s" target="_blank">freedom levels</a> to view this video. Support free software and upgrade.', 'jetpack' ), 'https://www.gnu.org/philosophy/free-sw.html' ) . '</p>';
		} elseif ( isset( $this->video->title ) ) {
			$html .= '<p>' . esc_html( $this->video->title ) . '</p>';
		}
		$html .= '</video>';
		return $html;
	}

	/**
	 * Output for the HTML5 player.
	 */
	public function html5_dynamic_next() {
		$video_container_id = 'v-' . $this->video->guid;

		Jwt_Token_Bridge::enqueue_jwt_token_bridge();

		// Must not use iframes for IE11 due to a fullscreen bug
		if ( isset( $_SERVER['HTTP_USER_AGENT'] ) && stristr( sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ), 'Trident/7.0; rv:11.0' ) ) {
			$iframe_embed = false;
		} else {
			// The site setting and the `jetpack_videopress_player_use_iframe` filter decide; see Inline_Player::is_enabled().
			$iframe_embed = ! Inline_Player::is_enabled();
		}

		if ( ! array_key_exists( 'hd', $this->options ) ) {
			$this->options['hd'] = (bool) get_option( 'video_player_high_quality', false );
		}

		if ( ! array_key_exists( 'cover', $this->options ) ) {
			$this->options['cover'] = true;
		}

		$videopress_options = array(
			'width'  => absint( $this->video->calculated_width ),
			'height' => absint( $this->video->calculated_height ),
		);
		foreach ( $this->options as $option => $value ) {
			switch ( $option ) {
				case 'at':
					if ( (int) $value ) {
						$videopress_options[ $option ] = (int) $value;
					}
					break;
				case 'autoplay':
					$option = 'autoPlay'; // Fall-through ok.
				case 'hd':
				case 'loop':
				case 'permalink':
				case 'cover':
				case 'muted':
				case 'controls':
				case 'playsinline':
				case 'useAverageColor':
					if ( in_array( $value, array( true, 1, 'true' ), true ) ) {
						$videopress_options[ $option ] = true;
					} elseif ( in_array( $value, array( false, 0, 'false' ), true ) ) {
						$videopress_options[ $option ] = false;
					}
					// phpcs:enable
					break;
				case 'defaultlangcode':
					$option = 'defaultLangCode';
					if ( $value ) {
						$videopress_options[ $option ] = $value;
					}
					break;
				case 'preloadContent':
					if ( $value ) {
						$videopress_options['preloadContent'] = $value;
					}
			}
		}

		if ( $iframe_embed ) {
			$iframe_url = "https://videopress.com/embed/{$this->video->guid}";

			foreach ( $videopress_options as $option => $value ) {
				if ( ! in_array( $option, array( 'width', 'height' ), true ) ) {

					// add_query_arg ignores false as a value, so replacing it with 0
					// @phan-suppress-next-line PhanPluginSimplifyExpressionBool -- Probably it could, but semantically let's keep it as-is.
					$iframe_url = add_query_arg( $option, ( false === $value ) ? 0 : $value, $iframe_url );
				}
			}

			$cover = $videopress_options['cover'] ? ' data-resize-to-parent="true"' : '';

			wp_enqueue_script( 'videopress-iframe', 'https://videopress.com/videopress-iframe.js', array(), JETPACK__VERSION, true );

			return "<iframe title='" . __( 'VideoPress Video Player', 'jetpack' )
				. "' aria-label='" . __( 'VideoPress Video Player', 'jetpack' )
				. "' width='" . esc_attr( $videopress_options['width'] )
				. "' height='" . esc_attr( $videopress_options['height'] )
				. "' src='" . esc_attr( $iframe_url )
				. "' frameborder='0' allowfullscreen"
				. $cover
				. " allow='clipboard-write; presentation'></iframe>";

		} else {
			$attributes = array(
				'autoplay'        => $videopress_options['autoPlay'] ?? false,
				'controls'        => $videopress_options['controls'] ?? true,
				'loop'            => $videopress_options['loop'] ?? false,
				'muted'           => $videopress_options['muted'] ?? false,
				'playsinline'     => $videopress_options['playsinline'] ?? false,
				'useAverageColor' => $videopress_options['useAverageColor'] ?? true,
				'cover'           => $videopress_options['cover'],
				'hd'              => $videopress_options['hd'],
				'at'              => $videopress_options['at'] ?? 0,
				'preload'         => $videopress_options['preloadContent'] ?? 'metadata',
				'defaultLangCode' => $videopress_options['defaultLangCode'] ?? '',
			);
			$ratio      = $videopress_options['width'] > 0
				? ( $videopress_options['height'] / $videopress_options['width'] ) * 100
				: null;

			$guid = (string) $this->video->guid;

			// The video data already carries the poster frame VideoPress serves for this site.
			$poster = ! empty( $this->video->poster_frame_uri ) && is_string( $this->video->poster_frame_uri )
				? $this->video->poster_frame_uri
				: Inline_Player::get_poster_url( $guid );

			return "<div id='" . esc_attr( $video_container_id ) . "'>"
				. Inline_Player::render(
					$guid,
					Inline_Player::get_player_options( $attributes ),
					$ratio,
					array(
						'poster' => $poster,
						'title'  => isset( $this->video->title ) ? (string) $this->video->title : '',
					)
				)
				. '</div>';
		}
	}

	/**
	 * Validate legacy Flash parameters for backward compatibility.
	 *
	 * @since 1.2
	 * @deprecated $$next-version$$ Flash playback is no longer supported.
	 * @param array $flash_params Flash parameters expressed in key-value form.
	 * @return array Validated Flash parameters.
	 */
	public static function esc_flash_params( $flash_params ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );

		$allowed_params = array(
			'swliveconnect'         => array( 'true', 'false' ),
			'play'                  => array( 'true', 'false' ),
			'loop'                  => array( 'true', 'false' ),
			'menu'                  => array( 'true', 'false' ),
			'quality'               => array( 'low', 'autolow', 'autohigh', 'medium', 'high', 'best' ),
			'scale'                 => array( 'default', 'noborder', 'exactfit', 'noscale' ),
			'align'                 => array( 'l', 'r', 't' ),
			'salign'                => array( 'l', 'r', 't', 'tl', 'tr', 'bl', 'br' ),
			'wmode'                 => array( 'window', 'opaque', 'transparent', 'direct', 'gpu' ),
			'devicefont'            => array( '_sans', '_serif', '_typewriter' ),
			'allowscriptaccess'     => array( 'always', 'samedomain', 'never' ),
			'allownetworking'       => array( 'all', 'internal', 'none' ),
			'seamlesstabbing'       => array( 'true', 'false' ),
			'allowfullscreen'       => array( 'true', 'false' ),
			'fullScreenAspectRatio' => array( 'portrait', 'landscape' ),
		);

		$filtered_params = array();
		foreach ( $flash_params as $param => $value ) {
			if ( empty( $param ) || empty( $value ) ) {
				continue;
			}
			$param = strtolower( $param );
			if ( isset( $allowed_params[ $param ] ) ) {
				$value = strtolower( $value );
				if ( in_array( $value, $allowed_params[ $param ], true ) ) {
					$filtered_params[ $param ] = $value;
				}
			}
		}

		// Flash requires the case-sensitive value sameDomain.
		if ( isset( $filtered_params['allowscriptaccess'] ) && $filtered_params['allowscriptaccess'] === 'samedomain' ) {
			$filtered_params['allowscriptaccess'] = 'sameDomain';
		}

		return $filtered_params;
	}
}
