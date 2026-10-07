<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Assets;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Brightcove shortcode.
 *
 * Brighcove had renovated their video player embedding code since they introduced their "new studio".
 * See https://support.brightcove.com/en/video-cloud/docs.
 * The new code is not 100% backward compatible, as long as a customized player is used.
 * By the time I wrote this, there were about 150000+ posts embedded legacy players, so it would be a bad
 * idea either to introduce a new brightcove shortcode, or to break those posts completely.
 *
 * That's why we introduce a less aggressive way: leaving the old embedding code untouched, and
 * introduce a new set of shortcode parameters which are translated to the latest Brightcove embedding code.
 *
 * e.g.
 * [brightcove video_id="12345" account_id="99999"] will be translated to the latest embedding code.
 * [brightcove exp=627045696&vid=1415670151] or [brightcove exp=1463233149&vref=1601200825] will be translated
 * to the legacy code.
 */
class Jetpack_Brightcove_Shortcode {
	/**
	 * Shortcode name.
	 *
	 * @var string
	 */
	public static $shortcode = 'brightcove';

	/**
	 * Parse shortcode arguments and render its output.
	 *
	 * @since 4.5.0
	 *
	 * @param array $atts Shortcode parameters.
	 *
	 * @return string
	 */
	public static function convert( $atts ) {
		$normalized_atts = self::normalize_attributes( $atts );

		if ( empty( $atts ) ) {
			return '<!-- Missing Brightcove parameters -->';
		}

		return self::has_legacy_atts( $normalized_atts )
			? self::convert_to_legacy_studio( $normalized_atts )
			: self::convert_to_new_studio( $normalized_atts );
	}

	/**
	 * We need to take care of two kinds of shortcode format here.
	 * The latest: [shortcode a=1 b=2] and the legacy: [shortcode a=1&b=2]
	 * For an old shortcode: [shortcode a=1&b=2&c=3], it would be parsed into array( 'a' => 1&b=2&c=3' ), which is useless.
	 * However, since we want to determine whether to call convert_to_legacy_studio() or convert_to_new_studio() via passed parameters, we still need to parse the two properly.
	 * See https://jetpack.wp-a2z.org/oik_api/shortcode_new_to_old_params/
	 *
	 * @since 4.5.0
	 *
	 * @param array $atts Shortcode parameters.
	 *
	 * @return array
	 */
	public static function normalize_attributes( $atts ) {
		if ( is_array( $atts ) && 1 === count( $atts ) ) { // this is the case we need to take care of.
			$parsed_atts = array();
			$params      = shortcode_new_to_old_params( $atts );

			/**
			 * Filter the Brightcove shortcode parameters.
			 *
			 * @module shortcodes
			 *
			 * @since 4.5.0
			 *
			 * @param string $params String of shortcode parameters.
			 */
			$params = apply_filters( 'brightcove_dimensions', $params );
			parse_str( $params, $parsed_atts );

			return $parsed_atts;
		} else {
			return $atts;
		}
	}

	/**
	 * Check that it has legacy attributes.
	 *
	 * @since 4.5.0
	 *
	 * @param array $atts Shortcode parameters.
	 *
	 * @return bool
	 */
	public static function has_legacy_atts( $atts ) {
		return ( isset( $atts['vid'] ) || isset( $atts['vref'] ) )
			&& ( isset( $atts['exp'] ) || isset( $atts['exp3'] ) );
	}

	/**
	 * Convert to latest player format.
	 *
	 * @since 4.5.0
	 *
	 * @param array $atts Shortcode parameters.
	 *
	 * @return string
	 */
	public static function convert_to_new_studio( $atts ) {
		$defaults = array(
			'account_id' => '',
			'video_id'   => '',
			'player_id'  => 'default',
			'width'      => '100%',
			'height'     => '100%',
		);

		$atts_applied = shortcode_atts( $defaults, $atts, self::$shortcode );

		$player_url = sprintf(
			'//players.brightcove.net/%s/%s_default/index.html?videoId=%s',
			esc_attr( $atts_applied['account_id'] ),
			esc_attr( $atts_applied['player_id'] ),
			esc_attr( $atts_applied['video_id'] )
		);

		$output_html = sprintf(
			'<iframe src="' . esc_url( $player_url ) . '" allowfullscreen webkitallowfullscreen mozallowfullscreen style="width: %spx; height: %spx;"></iframe>',
			esc_attr( $atts_applied['width'] ),
			esc_attr( $atts_applied['height'] )
		);

		return $output_html;
	}

	/**
	 * Convert to legacy player format.
	 *
	 * [brightcove exp=627045696&vid=1415670151] for the older player and backward compatibility
	 * [brightcove exp=1463233149&vref=1601200825] for the new player
	 *
	 * @since 4.5.0
	 *
	 * @param array $atts Shortcode parameters.
	 *
	 * @return string
	 */
	public static function convert_to_legacy_studio( $atts ) {
		$attr = shortcode_atts(
			array(
				'bg'    => '',
				'exp'   => '',
				'exp3'  => '',
				'h'     => '',
				'lbu'   => '',
				'pk'    => '',
				'pubid' => '',
				's'     => '',
				'surl'  => '',
				'vid'   => '',
				'vref'  => '',
				'w'     => '',
			),
			$atts
		);

		if ( isset( $attr['pk'] ) ) {
			$attr['pk'] = rawurlencode( preg_replace( '/[^a-zA-Z0-9!*\'();:@&=+$,\/?#\[\]\-_.~ ]/', '', $attr['pk'] ) );
		}

		if ( isset( $attr['bg'] ) ) {
			$attr['bg'] = preg_replace( '![^-a-zA-Z0-9#]!', '', $attr['bg'] );
		}

		$js_tld = 'com';
		if ( isset( $attr['surl'] ) && strpos( $attr['surl'], 'brightcove.co.jp' ) ) {
			$js_tld = 'co.jp';
		}

		$attr['exp3'] = (int) $attr['exp3'];
		$attr['vid']  = (int) $attr['vid'];

		$width  = null;
		$height = null;

		if ( ! empty( $attr['w'] ) && ! empty( $attr['h'] ) ) {
			$w = abs( (int) $attr['w'] );
			$h = abs( (int) $attr['h'] );
			if ( $w && $h ) {
				$width  = $w;
				$height = $h;
			}
		} elseif ( empty( $attr['s'] ) || 'l' === $attr['s'] ) {
			$width  = '480';
			$height = '360';
		}

		if ( empty( $width ) || empty( $height ) ) {
			$width  = '280';
			$height = '210';
		}

		wp_enqueue_script(
			'brightcove-loader',
			Assets::get_file_url_for_environment( '_inc/build/shortcodes/js/brightcove.min.js', 'modules/shortcodes/js/brightcove.js' ),
			array( 'jquery' ),
			20121127,
			false
		);
		wp_localize_script(
			'brightcove-loader',
			'brightcoveData',
			array(
				'tld' => $js_tld,
			)
		);

		return '
			<object id="myExperience" class="BrightcoveExperience">
				<param name="bgcolor" value="' . esc_attr( $attr['bg'] ) . '" />
				<param name="width" value="' . esc_attr( $width ) . '" />
				<param name="height" value="' . esc_attr( $height ) . '" />
				<param name="playerID" value="' . esc_attr( $attr['exp3'] ) . '" />
				<param name="@videoPlayer" value="' . esc_attr( $attr['vid'] ) . '" />
				<param name="playerKey" value="' . esc_attr( $attr['pk'] ) . '" />
				<param name="isVid" value="1" />
				<param name="isUI" value="1" />
				<param name="dynamicStreaming" value="true" />
				<param name="autoStart" value="false" />
				<param name="secureConnections" value="true" />
				<param name="secureHTMLConnections" value="true" />
			</object>';
	}
}

add_shortcode( Jetpack_Brightcove_Shortcode::$shortcode, array( 'Jetpack_Brightcove_Shortcode', 'convert' ) );
