<?php
/**
 * Implements the Viewport functionality.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\Device_Detection;

/**
 * Class Viewport
 */
class Viewport {

	/**
	 * Viewport cookie name.
	 */
	const VIEWPORT_COOKIE = 'jetpack_boost_w';

	/**
	 * Mobile device identifier.
	 */
	const DEVICE_MOBILE = 'mobile';

	/**
	 * Desktop identifier.
	 */
	const DEVICE_DESKTOP = 'desktop';

	/**
	 * Default viewport sizes.
	 */
	const DEFAULT_VIEWPORT_SIZES = array(
		0 => array(
			'type'   => 'phone',
			'width'  => 640,
			'height' => 480,
		),
		1 => array(
			'type'   => 'tablet',
			'width'  => 1200,
			'height' => 800,
		),
		2 => array(
			'type'   => 'desktop',
			'width'  => 1600,
			'height' => 1050,
		),
	);

	/**
	 * Default viewports.
	 */
	const DEFAULT_VIEWPORTS = array(
		array(
			'device_type' => 'mobile',
			'viewport_id' => 0,
		),
		array(
			'device_type' => 'desktop',
			'viewport_id' => 2,
		),
	);

	/**
	 * Runs the module.
	 */
	public static function init() {
		if ( ! is_admin() ) {
			add_action(
				'wp_footer',
				array( __CLASS__, 'viewport_tracker' )
			);
		}
	}

	/**
	 * Prints JS viewport dimensions tracker to the page.
	 *
	 * The purpose of the tracker is to measure the actual device viewport and store that value
	 * in a cookie that is then consumed by `get_viewport_size`. The dimensions are updated
	 * whenever the page is loaded, viewport resized or document shown (using Page Visibility API).
	 *
	 * This allows site admins to define and target more granular real-world viewports.
	 *
	 * First page load from a new device will result in a viewport size guessed based on the device
	 * type (mobile vs. desktop). See `get_default_viewport_size_for_device` for more context.
	 */
	public static function viewport_tracker() {
		$domain = wp_parse_url( site_url(), PHP_URL_HOST );
		$path   = wp_parse_url( site_url(), PHP_URL_PATH );

		if ( ! $path ) {
			$path = '/';
		}

		$max_age       = 10 * \YEAR_IN_SECONDS;
		$script_source = <<<SCRIPT_SOURCE
			( function(doc) {
				var debouncer;
				var measure = function() {
					var cookieValue = Math.ceil( window.innerWidth / 10 ) + 'x' + Math.ceil( window.innerHeight / 10 );
					doc.cookie = "%s=" + cookieValue + "; domain=%s; path=%s; Max-Age=%s";
				}
				window.addEventListener( 'resize', function() {
					clearTimeout( debouncer );
					debouncer = setTimeout( measure, 500 );
				} );
				doc.addEventListener( 'visibilitychange', function() {
					if ( ! doc.hidden ) {
						measure();
					}
				} );
				measure();
			} )(document);
SCRIPT_SOURCE;

		$script_source = sprintf( $script_source, esc_js( self::VIEWPORT_COOKIE ), esc_js( $domain ), esc_js( $path ), esc_js( $max_age ) );

		if ( ! Debug::is_debug_mode() ) {
			$script_source = Minify::js( $script_source );
		}

		echo sprintf( '<script>%s</script>', $script_source ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Gets the size of the current viewport.
	 */
	public static function get_viewport_size() {
		$data         = null;
		$cookie_value = filter_input( INPUT_COOKIE, self::VIEWPORT_COOKIE );

		if ( $cookie_value ) {
			$raw_data = explode( 'x', $cookie_value );

			if ( 2 === count( $raw_data ) ) {
				$data = array(
					'width'  => intval( $raw_data[0] ) * 10,
					'height' => intval( $raw_data[1] ) * 10,
				);
			}
		} else {
			$device_type = Device_Detection::is_phone() ? self::DEVICE_MOBILE : self::DEVICE_DESKTOP;
			$data        = self::get_default_viewport_size_for_device( $device_type );
		}

		return apply_filters( 'jetpack_boost_viewport_size', $data, self::VIEWPORT_COOKIE, $cookie_value );
	}

	/**
	 * Get all the configured viewport sizes.
	 *
	 * @return array Viewport widths and heights
	 */
	public static function get_default_viewport_sizes() {
		return apply_filters( 'jetpack_boost_critical_css_viewport_sizes', self::DEFAULT_VIEWPORT_SIZES );
	}

	/**
	 * Get the default viewport size.
	 *
	 * @param string $device_type Device type.
	 *
	 * @return array Viewport width and height.
	 */
	public static function get_default_viewport_size_for_device( $device_type ) {
		$viewport_sizes    = apply_filters( 'jetpack_boost_critical_css_viewport_sizes', self::DEFAULT_VIEWPORT_SIZES );
		$default_viewports = apply_filters( 'jetpack_boost_critical_css_default_viewports', self::DEFAULT_VIEWPORTS );

		foreach ( $default_viewports as $default ) {
			if ( $device_type === $default['device_type'] ) {
				if ( isset( $viewport_sizes[ $default['viewport_id'] ] ) ) {
					return $viewport_sizes[ $default['viewport_id'] ];
				}
			}
		}

		return self::get_max_viewport( $viewport_sizes );
	}

	/**
	 * Picks the narrowest defined viewport that is equal or wider than the passed width.
	 *
	 * When there are multiple defined viewports of identical width, picks the smallest
	 * height that's equal or taller than the passed height.
	 *
	 * Example for w:550 h:400 and defined viewport sizes: 400x300, 640x400, 640x480, 1050x900, 1900x1200
	 *
	 * - The smallest viewports that are wider than the current one are: 640x400, 640x480
	 * - The one with the smallest height that is equal or taller than the passed dimensions: 640x400
	 * - Returned [ 640, 480 ]
	 *
	 * @param int $width  Width.
	 * @param int $height Height.
	 *
	 * @return array Viewport dimensions.
	 */
	public static function pick_viewport( $width, $height ) {
		// Get defined viewport sizes.
		$viewport_sizes = apply_filters( 'jetpack_boost_critical_css_viewport_sizes', self::DEFAULT_VIEWPORT_SIZES );

		// Default to the widest viewport in case we don't match anything.
		$best_size = self::get_max_viewport( $viewport_sizes );

		foreach ( $viewport_sizes as $viewport_size ) {
			// Skip viewports that are too narrow.
			if ( $viewport_size['width'] < $width ) {
				continue;
			}

			// Skip viewports that are wider than our best match.
			if ( $viewport_size['width'] > $best_size['width'] ) {
				continue;
			}

			// Pick viewports that are narrower than our best match.
			if ( $viewport_size['width'] < $best_size['width'] ) {
				$best_size = $viewport_size;
				continue;
			}

			// Current viewport and the best match have the same width, let's decide based on height.
			$current_is_tall_enough = $viewport_size['height'] >= $height;
			$best_is_tall_enough    = $best_size['height'] >= $height;

			if ( $current_is_tall_enough && ! $best_is_tall_enough ) {
				$best_size = $viewport_size; // Best match isn't tall enough, but the current match is.
				continue;
			}

			if ( $current_is_tall_enough && $best_is_tall_enough && $viewport_size['height'] < $best_size['height'] ) {
				$best_size = $viewport_size; // Both ARE tall enough, but the current match is shorter.
				continue;
			}

			if ( ! $current_is_tall_enough && ! $best_is_tall_enough && $viewport_size['height'] > $best_size['height'] ) {
				$best_size = $viewport_size; // Both ARE NOT tall enough, but the current match is taller.
				continue;
			}
		}

		return apply_filters( 'jetpack_boost_pick_viewport', $best_size, $width, $height, $viewport_sizes );
	}

	/**
	 * Reduce the viewports array and return the widest one.
	 *
	 * When there are multiple widest viewports, pick the tallest one from those.
	 *
	 * @param array $viewport_sizes Array of defined viewport sizes.
	 *
	 * @return array Viewport dimensions.
	 */
	public static function get_max_viewport( array $viewport_sizes ) {
		$max_viewport = array_reduce(
			$viewport_sizes,
			function ( $carry, $item ) {
				if ( $item['width'] > $carry['width'] ) {
					$carry = $item;
				} elseif ( $item['width'] === $carry['width'] ) {
					if ( $item['height'] > $carry['height'] ) {
						$carry = $item;
					}
				}

				return $carry;
			},
			array(
				'width'  => 0,
				'height' => 0,
			)
		);

		return $max_viewport;
	}
}
