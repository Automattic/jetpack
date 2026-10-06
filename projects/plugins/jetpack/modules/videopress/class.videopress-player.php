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
	 * DOM identifier of the video element (video, object, embed)
	 *
	 * @var string
	 * @since 1.3
	 */
	protected $video_id;

	/**
	 * Array of playback options: freedom
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

		} elseif ( isset( $this->options['freedom'] ) && true === $this->options['freedom'] ) {
			$content = $this->html5_static();

		} else {
			$content = $this->html5_dynamic();
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
	 * Rating agencies and industry associations require a potential viewer verify their age before a video or its poster frame are displayed.
	 * Content rated for audiences 17 years of age or older requires such verification across multiple rating agencies and industry associations
	 *
	 * @since 1.3
	 * @return bool true if video requires the viewer verify they are 17 years of age or older
	 */
	private function age_gate_required() {
		if ( isset( $this->video->age_rating ) && $this->video->age_rating >= 17 ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Select a date of birth using HTML form elements.
	 *
	 * @since 1.5
	 * @return string HTML markup
	 */
	private function html_age_gate() {
		global $wp_locale;
		$text_align = 'left';
		if ( $this->video->text_direction === 'rtl' ) {
			$text_align = 'right';
		}

		$html         = '<div class="videopress-age-gate" style="margin:0 60px">';
		$html        .= '<p class="instructions" style="color:rgb(255, 255, 255);font-size:21px;padding-top:60px;padding-bottom:20px;text-align:' . $text_align . '">' . esc_html( __( 'This video is intended for mature audiences.', 'jetpack' ) ) . '<br />' . esc_html( __( 'Please verify your birthday.', 'jetpack' ) ) . '</p>';
		$html        .= '<fieldset id="birthday" style="border:0 none;text-align:' . $text_align . ';padding:0;">';
		$inputs_style = 'border:1px solid #444;margin-';
		if ( $this->video->text_direction === 'rtl' ) {
			$inputs_style .= 'left';
		} else {
			$inputs_style .= 'right';
		}
		$inputs_style .= ':10px;background-color:rgb(0, 0, 0);font-size:14px;color:rgb(255,255,255);padding:4px 6px;line-height: 2em;vertical-align: middle';

		/**
		 * Display a list of months in the Gregorian calendar.
		 * Set values to 0-based to match JavaScript Date.
		 *
		 * @link https://developer.mozilla.org/en/JavaScript/Reference/global_objects/date Mozilla JavaScript Reference: Date
		 */
		$html .= '<select name="month" style="' . $inputs_style . '">';

		for ( $i = 0; $i < 12; $i++ ) {
			$html .= '<option value="' . esc_attr( $i ) . '">' . esc_html( $wp_locale->get_month( $i + 1 ) ) . '</option>';
		}
		$html .= '</select>';

		/**
		 * Todo: numdays variance by month.
		 */
		$html .= '<select name="day" style="' . $inputs_style . '">';
		for ( $i = 1; $i < 32; $i++ ) {
			$html .= '<option>' . $i . '</option>';
		}
		$html .= '</select>';

		/**
		 * Current record for human life is 122. Go back 130 years and no one is left out.
		 * Don't ask infants younger than 2 for their birthday
		 * Default to 13
		 */
		$html        .= '<select name="year" style="' . $inputs_style . '">';
		$start_year   = gmdate( 'Y' ) - 2;
		$default_year = $start_year - 11;
		$end_year     = $start_year - 128;
		for ( $year = $start_year; $year > $end_year; $year-- ) {
			$html .= '<option';
			if ( $year === $default_year ) {
				$html .= ' selected="selected"';
			}
			$html .= '>' . $year . '</option>';
		}
		unset( $start_year );
		unset( $default_year );
		unset( $end_year );
		$html .= '</select>';

		$html .= '<input type="submit" value="' . __( 'Submit', 'jetpack' ) . '" style="cursor:pointer;border-radius: 1em;border:1px solid #333;background-color:#333;background:-webkit-gradient( linear, left top, left bottom, color-stop(0.0, #444), color-stop(1, #111) );background:-moz-linear-gradient(center top, #444 0%, #111 100%);font-size:13px;padding:4px 10px 5px;line-height:1em;vertical-align:top;color:white;text-decoration:none;margin:0" />';

		$html .= '</fieldset>';
		$html .= '<p style="padding-top:20px;padding-bottom:60px;text-align:' . $text_align . ';"><a rel="nofollow noopener noreferrer" href="https://videopress.com/" target="_blank" style="color:rgb(128,128,128);text-decoration:underline;font-size:15px">' . __( 'More information', 'jetpack' ) . '</a></p>';

		$html .= '</div>';
		return $html;
	}

	/**
	 * Return HTML5 video static markup for the given video parameters.
	 * Use default browser player controls.
	 * No Flash fallback.
	 *
	 * @since 1.2
	 * @link https://html.spec.whatwg.org/multipage/media.html#the-video-element HTML5 video
	 * @return string HTML5 video element and children
	 */
	private function html5_static() {
		wp_enqueue_script( 'videopress' );
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
	 * Click to play dynamic HTML5 player.
	 *
	 * @since 1.5
	 * @return string HTML markup
	 */
	private function html5_dynamic() {
		return $this->html5_dynamic_next();
	}

	/**
	 * Output for the non-legacy HTML5 player.
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

}
