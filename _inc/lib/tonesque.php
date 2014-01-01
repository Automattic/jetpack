<?php
/*
Plugin Name: Tonesque
Plugin URI: http://automattic.com/
Description: Grab an average color representation from an image.
Version: 1.0
Author: Automattic, Matias Ventura
Author URI: http://automattic.com/
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

class Tonesque {

	private $image_url = '';
	private $image_obj = NULL;
	private $color = '';

	function __construct( $image_url ) {
		if ( ! class_exists( 'Jetpack_Color' ) )
			jetpack_require_lib( 'class.color' );

		$this->image_url = esc_url_raw( $image_url );
		$this->image_url = trim( $this->image_url );
		$this->image_url = apply_filters( 'tonesque_image_url', $this->image_url );

		$this->image_obj = self::imagecreatefromurl( $this->image_url );
	}

	public static function imagecreatefromurl( $image_url ) {
	 	// Grab the extension
		$file = strtolower( pathinfo( $image_url, PATHINFO_EXTENSION ) );
		$file = explode( '?', $file );
		$file = $file[ 0 ];

		switch ( $file ) {
			case 'gif' :
				$image_obj = imagecreatefromgif( $image_url );
				break;
			case 'png' :
				$image_obj = imagecreatefrompng( $image_url );
				break;
			case 'jpg' :
			case 'jpeg' :
				$image_obj = imagecreatefromjpeg( $image_url );
				break;
			default:
				return false;
		}

		return $image_obj;
	}

	/**
	 *
	 * Construct object from image.
	 *
	 * @param optional $type (hex, rgb, hsl)
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
				$color = implode( $c->toRgbInt(), ',' );
				break;
			case 'hex' :
				$color = $c->toHex();
				break;
			case 'hsv' :
				$color = implode( $c->toHsvInt(), ',' );
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
		return implode( $c->toRgbInt(), ',' );
	}

};
