<?php
/*
Plugin Name: Tonesque
Plugin URI: https://automattic.com/
Description: Grab an average color representation from an image.
Version: 1.0
Author: Automattic, Matias Ventura
Author URI: https://automattic.com/
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
*/

class Tonesque {

	private $image_url = '';
	private $image_obj = NULL;
	private $color = '';

	function __construct( $image_url ) {
		if ( ! class_exists( 'Jetpack_Color' ) ) {
			jetpack_require_lib( 'class.color' );
		}

		$this->image_url = esc_url_raw( $image_url );
		$this->image_url = trim( $this->image_url );
		/**
		 * Allows any image URL to be passed in for $this->image_url.
		 *
		 * @module theme-tools
		 *
		 * @since 2.5.0
		 *
		 * @param string $image_url The URL to any image
		 */
		$this->image_url = apply_filters( 'tonesque_image_url', $this->image_url );

		$this->image_obj = self::imagecreatefromurl( $this->image_url );
	}

	public static function imagecreatefromurl( $image_url ) {
		$data = null;

		// If it's a URL:
		if ( preg_match( '#^https?://#i', $image_url ) ) {
			// If it's a url pointing to a local media library url:
			$content_url = content_url();
			$_image_url  = set_url_scheme( $image_url );
			if ( wp_startswith( $_image_url, $content_url ) ) {
				$_image_path = str_replace( $content_url, WP_CONTENT_DIR, $_image_url );
				if ( file_exists( $_image_path ) ) {
					$filetype = wp_check_filetype( $_image_path );
					$ext = $filetype['ext'];
					$type = $filetype['type'];

					if ( wp_startswith( $type, 'image/' ) ) {
						$data = file_get_contents( $_image_path );
					}
				}
			}

			if ( empty( $data ) ) {
				$response = wp_remote_get( $image_url );
				if ( is_wp_error( $response ) ) {
					return false;
				}
				$data = wp_remote_retrieve_body( $response );
			}
		}

		// If it's a local path in our WordPress install:
		if ( file_exists( $image_url ) ) {
			$filetype = wp_check_filetype( $image_url );
			$ext = $filetype['ext'];
			$type = $filetype['type'];

			if ( wp_startswith( $type, 'image/' ) ) {
				$data = file_get_contents( $image_url );
			}
		}

		// Now turn it into an image and return it.
		return imagecreatefromstring( $data );
	}

	/**
	 *
	 * Construct object from image.
	 *
	 * @param optional $type (hex, rgb, hsv)
	 * @return color as a string formatted as $type
	 *
 	 */
	function color( $type = 'hex' ) {
		// Bail if there is no image to work with
	 	if ( ! $this->image_obj )
			return false;

		// Finds dominant color
		$color = self::grab_color();
		// Passes value to Color class
		$color = self::get_color( $color, $type );
		return $color;
	}

	/**
	 *
	 * Grabs the color index for each of five sample points of the image
	 *
	 * @param $image
	 * @param $type can be 'index' or 'hex'
	 * @return array() with color indices
	 *
 	 */
	function grab_points( $type = 'index' ) {
		$img = $this->image_obj;
		if ( ! $img )
			return false;

		$height = imagesy( $img );
		$width  = imagesx( $img );

		// Sample five points in the image
		// Based on rule of thirds and center
		$topy    = round( $height / 3 );
		$bottomy = round( ( $height / 3 ) * 2 );
		$leftx   = round( $width / 3 );
		$rightx  = round( ( $width / 3 ) * 2 );
		$centery = round( $height / 2 );
		$centerx = round( $width / 2 );

		// Cast those colors into an array
		$points = array(
			imagecolorat( $img, $leftx, $topy ),
			imagecolorat( $img, $rightx, $topy ),
			imagecolorat( $img, $leftx, $bottomy ),
			imagecolorat( $img, $rightx, $bottomy ),
			imagecolorat( $img, $centerx, $centery ),
		);

		if ( 'hex' == $type ) {
			foreach ( $points as $i => $p ) {
				$c = imagecolorsforindex( $img, $p );
				$points[ $i ] = self::get_color( array(
					'r' => $c['red'],
					'g' => $c['green'],
					'b' => $c['blue'],
				), 'hex' );
			}
		}

		return $points;
	}

	/**
	 *
	 * Finds the average color of the image based on five sample points
	 *
	 * @param $image
	 * @return array() with rgb color
	 *
 	 */
	function grab_color() {
		$img = $this->image_obj;
		if ( ! $img )
			return false;

		$rgb = self::grab_points();

		// Process the color points
		// Find the average representation
		foreach ( $rgb as $color ) {
			$index = imagecolorsforindex( $img, $color );
			$r[] = $index['red'];
			$g[] = $index['green'];
			$b[] = $index['blue'];

			$red = round( array_sum( $r ) / 5 );
			$green = round( array_sum( $g ) / 5 );
			$blue = round( array_sum( $b ) / 5 );
		}

		// The average color of the image as rgb array
		$color = array(
			'r' => $red,
			'g' => $green,
			'b' => $blue,
		);

		return $color;
	}

	/**
	 *
	 * Get a Color object using /lib class.color
	 * Convert to appropriate type
	 *
	 * @return string
	 *
	 */
	function get_color( $color, $type ) {
		$c = new Jetpack_Color( $color, 'rgb' );
		$this->color = $c;

		switch ( $type ) {
			case 'rgb' :
				$color = implode( ',', $c->toRgbInt() );
				break;
			case 'hex' :
				$color = $c->toHex();
				break;
			case 'hsv' :
				$color = implode( ',', $c->toHsvInt() );
				break;
			default:
				return $color = $c->toHex();
		}

		return $color;
	}

	/**
	 *
	 * Checks contrast against main color
	 * Gives either black or white for using with opacity
	 *
	 * @return string
	 *
 	 */
	function contrast() {
	 	if ( ! $this->color )
			return false;

		$c = $this->color->getMaxContrastColor();
		return implode( ',', $c->toRgbInt() );
	}

};
