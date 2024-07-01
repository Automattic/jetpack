<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Color utility and conversion
 *
 * Represents a color value, and converts between RGB/HSV/XYZ/Lab/HSL
 *
 * Example:
 * $color = new Jetpack_Color(0xFFFFFF);
 *
 * @author Harold Asbridge <hasbridge@gmail.com>
 * @author Matt Wiebe <wiebe@automattic.com>
 * @license https://www.opensource.org/licenses/MIT
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid

/**
 * Color utilities
 */
class Jetpack_Color {
	/**
	 * Color code (later array or string, depending on type)
	 *
	 * @var int|array|string
	 */
	protected $color = 0;

	/**
	 * Initialize object
	 *
	 * @param string|array $color A color of the type $type.
	 * @param string       $type The type of color we will construct from.
	 *        One of hex (default), rgb, hsl, int.
	 */
	public function __construct( $color = null, $type = 'hex' ) {
		if ( $color ) {
			switch ( $type ) {
				case 'hex':
					$this->fromHex( $color );
					break;
				case 'rgb':
					if ( is_array( $color ) && count( $color ) === 3 ) {
						list( $r, $g, $b ) = array_values( $color );
						$this->fromRgbInt( $r, $g, $b );
					}
					break;
				case 'hsl':
					if ( is_array( $color ) && count( $color ) === 3 ) {
						list( $h, $s, $l ) = array_values( $color );
						$this->fromHsl( $h, $s, $l );
					}
					break;
				case 'int':
					$this->fromInt( $color );
					break;
				default:
					// there is no default.
					break;
			}
		}
	}

	/**
	 * Init color from hex value
	 *
	 * @param string $hex_value Color hex value.
	 *
	 * @return $this
	 * @throws RangeException Invalid color code range error.
	 */
	public function fromHex( $hex_value ) {
		$hex_value = str_replace( '#', '', $hex_value );
		// handle short hex codes like #fff.
		if ( 3 === strlen( $hex_value ) ) {
			$hex_value = $hex_value[0] . $hex_value[0] . $hex_value[1] . $hex_value[1] . $hex_value[2] . $hex_value[2];
		}
		return $this->fromInt( hexdec( $hex_value ) );
	}

	/**
	 * Init color from integer RGB values
	 *
	 * @param int $red   Red color code.
	 * @param int $green Green color code.
	 * @param int $blue  Blue color code.
	 *
	 * @return $this
	 * @throws RangeException Invalid color code range error.
	 */
	public function fromRgbInt( $red, $green, $blue ) {
		if ( $red < 0 || $red > 255 ) {
			throw new RangeException( 'Red value ' . $red . ' out of valid color code range' );
		}

		if ( $green < 0 || $green > 255 ) {
			throw new RangeException( 'Green value ' . $green . ' out of valid color code range' );
		}

		if ( $blue < 0 || $blue > 255 ) {
			throw new RangeException( 'Blue value ' . $blue . ' out of valid color code range' );
		}

		$this->color = ( intval( $red ) << 16 ) + ( intval( $green ) << 8 ) + intval( $blue );

		return $this;
	}

	/**
	 * Init color from hex RGB values
	 *
	 * @param string $red   Red color code.
	 * @param string $green Green color code.
	 * @param string $blue  Blue color code.
	 *
	 * @return $this
	 */
	public function fromRgbHex( $red, $green, $blue ) {
		return $this->fromRgbInt( hexdec( $red ), hexdec( $green ), hexdec( $blue ) );
	}

	/**
	 * Converts an HSL color value to RGB. Conversion formula
	 * adapted from https://en.wikipedia.org/wiki/HSL_color_space.
	 *
	 * @param  int $h Hue. [0-360].
	 * @param  int $s Saturation [0, 100].
	 * @param  int $l Lightness [0, 100].
	 */
	public function fromHsl( $h, $s, $l ) {
		$h /= 360;
		$s /= 100;
		$l /= 100;

		if ( 0 === $s ) {
			// achromatic.
			$r = $l;
			$g = $l;
			$b = $l;
		} else {
			$q = $l < 0.5 ? $l * ( 1 + $s ) : $l + $s - $l * $s;
			$p = 2 * $l - $q;
			$r = $this->hue2rgb( $p, $q, $h + 1 / 3 );
			$g = $this->hue2rgb( $p, $q, $h );
			$b = $this->hue2rgb( $p, $q, $h - 1 / 3 );
		}

		return $this->fromRgbInt( $r * 255, $g * 255, $b * 255 );
	}

	/**
	 * Helper function for Jetpack_Color::fromHsl()
	 *
	 * @param  float $p Minimum of R/G/B [0, 1].
	 * @param  float $q Maximum of R/G/B [0, 1].
	 * @param  float $t Adjusted hue [0, 1].
	 */
	private function hue2rgb( $p, $q, $t ) {
		if ( $t < 0 ) {
			++$t;
		}
		if ( $t > 1 ) {
			--$t;
		}
		if ( $t < 1 / 6 ) {
			return $p + ( $q - $p ) * 6 * $t;
		}
		if ( $t < 1 / 2 ) {
			return $q;
		}
		if ( $t < 2 / 3 ) {
			return $p + ( $q - $p ) * ( 2 / 3 - $t ) * 6;
		}
		return $p;
	}

	/**
	 * Init color from integer value
	 *
	 * @param int $int_value Color code.
	 *
	 * @return $this
	 * @throws RangeException Invalid color code range error.
	 */
	public function fromInt( $int_value ) {
		if ( $int_value < 0 || $int_value > 16777215 ) {
			throw new RangeException( $int_value . ' out of valid color code range' );
		}

		$this->color = $int_value;

		return $this;
	}

	/**
	 * Convert color to hex
	 *
	 * @return string
	 */
	public function toHex() {
		return sprintf( '%06x', $this->color );
	}

	/**
	 * Convert color to RGB array (integer values)
	 *
	 * @return array
	 */
	public function toRgbInt() {
		return array(
			'red'   => (int) ( 255 & ( $this->color >> 16 ) ),
			'green' => (int) ( 255 & ( $this->color >> 8 ) ),
			'blue'  => (int) ( 255 & ( $this->color ) ),
		);
	}

	/**
	 * Convert color to RGB array (hex values)
	 *
	 * @return array
	 */
	public function toRgbHex() {
		$r = array();
		foreach ( $this->toRgbInt() as $item ) {
			$r[] = dechex( $item );
		}
		return $r;
	}

	/**
	 * Get Hue/Saturation/Value for the current color
	 * (float values, slow but accurate)
	 *
	 * @return array
	 */
	public function toHsvFloat() {
		$rgb = $this->toRgbInt();

		$rgb_min = min( $rgb );
		$rgb_max = max( $rgb );

		$hsv = array(
			'hue' => 0,
			'sat' => 0,
			'val' => $rgb_max,
		);

		// If v is 0, color is black.
		if ( 0 === $hsv['val'] ) {
			return $hsv;
		}

		// Normalize RGB values to 1.
		$rgb['red']   /= $hsv['val'];
		$rgb['green'] /= $hsv['val'];
		$rgb['blue']  /= $hsv['val'];
		$rgb_min       = min( $rgb );
		$rgb_max       = max( $rgb );

		// Calculate saturation.
		$hsv['sat'] = $rgb_max - $rgb_min;
		if ( 0 === $hsv['sat'] ) {
			$hsv['hue'] = 0;
			return $hsv;
		}

		// Normalize saturation to 1.
		$rgb['red']   = ( $rgb['red'] - $rgb_min ) / ( $rgb_max - $rgb_min );
		$rgb['green'] = ( $rgb['green'] - $rgb_min ) / ( $rgb_max - $rgb_min );
		$rgb['blue']  = ( $rgb['blue'] - $rgb_min ) / ( $rgb_max - $rgb_min );
		$rgb_min      = min( $rgb );
		$rgb_max      = max( $rgb );

		// Calculate hue.
		if ( $rgb_max === $rgb['red'] ) {
			$hsv['hue'] = 0.0 + 60 * ( $rgb['green'] - $rgb['blue'] );
			if ( $hsv['hue'] < 0 ) {
				$hsv['hue'] += 360;
			}
		} elseif ( $rgb_max === $rgb['green'] ) {
			$hsv['hue'] = 120 + ( 60 * ( $rgb['blue'] - $rgb['red'] ) );
		} else {
			$hsv['hue'] = 240 + ( 60 * ( $rgb['red'] - $rgb['green'] ) );
		}

		return $hsv;
	}

	/**
	 * Get HSV values for color
	 * (integer values from 0-255, fast but less accurate)
	 *
	 * @return array
	 */
	public function toHsvInt() {
		$rgb = $this->toRgbInt();

		$rgb_min = min( $rgb );
		$rgb_max = max( $rgb );

		$hsv = array(
			'hue' => 0,
			'sat' => 0,
			'val' => $rgb_max,
		);

		// If value is 0, color is black.
		if ( 0 === $hsv['val'] ) {
			return $hsv;
		}

		// Calculate saturation.
		$hsv['sat'] = round( 255 * ( $rgb_max - $rgb_min ) / $hsv['val'] );
		if ( 0 === $hsv['sat'] ) {
			$hsv['hue'] = 0;
			return $hsv;
		}

		// Calculate hue.
		if ( $rgb_max === $rgb['red'] ) {
			$hsv['hue'] = round( 0 + 43 * ( $rgb['green'] - $rgb['blue'] ) / ( $rgb_max - $rgb_min ) );
		} elseif ( $rgb_max === $rgb['green'] ) {
			$hsv['hue'] = round( 85 + 43 * ( $rgb['blue'] - $rgb['red'] ) / ( $rgb_max - $rgb_min ) );
		} else {
			$hsv['hue'] = round( 171 + 43 * ( $rgb['red'] - $rgb['green'] ) / ( $rgb_max - $rgb_min ) );
		}
		if ( $hsv['hue'] < 0 ) {
			$hsv['hue'] += 255;
		}

		return $hsv;
	}

	/**
	 * Converts an RGB color value to HSL. Conversion formula
	 * adapted from https://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes r, g, and b are contained in the set [0, 255] and
	 * returns h in [0, 360], s in [0, 100], l in [0, 100]
	 *
	 * @return  Array          The HSL representation
	 */
	public function toHsl() {
		list( $r, $g, $b ) = array_values( $this->toRgbInt() );
		$r                /= 255;
		$g                /= 255;
		$b                /= 255;
		$max               = max( $r, $g, $b );
		$min               = min( $r, $g, $b );
		$l                 = ( $max + $min ) / 2;

		if ( $max === $min ) {
			// achromatic.
			$s = 0;
			$h = 0;
		} else {
			$d = $max - $min;
			$s = $l > 0.5 ? $d / ( 2 - $max - $min ) : $d / ( $max + $min );
			switch ( $max ) {
				case $r:
					$h = ( $g - $b ) / $d + ( $g < $b ? 6 : 0 );
					break;
				case $g:
					$h = ( $b - $r ) / $d + 2;
					break;
				case $b:
					$h = ( $r - $g ) / $d + 4;
					break;
			}
			$h /= 6;
		}
		$h = (int) round( $h * 360 );
		$s = (int) round( $s * 100 );
		$l = (int) round( $l * 100 );
		return compact( 'h', 's', 'l' );
	}

	/**
	 * From a color code to a string to be used in CSS declaration.
	 *
	 * @param string $type  Color code type.
	 * @param int    $alpha Transparency.
	 *
	 * @return string
	 */
	public function toCSS( $type = 'hex', $alpha = 1 ) {
		switch ( $type ) {
			case 'hex':
				return $this->toString();
			case 'rgb':
			case 'rgba':
				list( $r, $g, $b ) = array_values( $this->toRgbInt() );
				if ( is_numeric( $alpha ) && $alpha < 1 ) {
					return "rgba( {$r}, {$g}, {$b}, $alpha )";
				} else {
					return "rgb( {$r}, {$g}, {$b} )";
				}
			case 'hsl':
			case 'hsla':
				list( $h, $s, $l ) = array_values( $this->toHsl() );
				if ( is_numeric( $alpha ) && $alpha < 1 ) {
					return "hsla( {$h}, {$s}, {$l}, $alpha )";
				} else {
					return "hsl( {$h}, {$s}, {$l} )";
				}
			default:
				return $this->toString();
		}
	}

	/**
	 * Get current color in XYZ format
	 *
	 * @return array
	 */
	public function toXyz() {
		$rgb = $this->toRgbInt();

		// Normalize RGB values to 1.
		$rgb_new = array();
		foreach ( $rgb as $item ) {
			$rgb_new[] = $item / 255;
		}
		$rgb = $rgb_new;

		$rgb_new = array();
		foreach ( $rgb as $item ) {
			if ( $item > 0.04045 ) {
				$item = pow( ( ( $item + 0.055 ) / 1.055 ), 2.4 );
			} else {
				$item = $item / 12.92;
			}
			$rgb_new[] = $item * 100;
		}
		$rgb = $rgb_new;

		// Observer. = 2°, Illuminant = D65.
		$xyz = array(
			'x' => ( $rgb['red'] * 0.4124 ) + ( $rgb['green'] * 0.3576 ) + ( $rgb['blue'] * 0.1805 ),
			'y' => ( $rgb['red'] * 0.2126 ) + ( $rgb['green'] * 0.7152 ) + ( $rgb['blue'] * 0.0722 ),
			'z' => ( $rgb['red'] * 0.0193 ) + ( $rgb['green'] * 0.1192 ) + ( $rgb['blue'] * 0.9505 ),
		);

		return $xyz;
	}

	/**
	 * Get color CIE-Lab values
	 *
	 * @return array
	 */
	public function toLabCie() {
		$xyz = $this->toXyz();

		// Ovserver = 2*, Iluminant=D65.
		$xyz['x'] /= 95.047;
		$xyz['y'] /= 100;
		$xyz['z'] /= 108.883;

		$xyz_new = array();
		foreach ( $xyz as $item ) {
			if ( $item > 0.008856 ) {
				$xyz_new[] = pow( $item, 1 / 3 );
			} else {
				$xyz_new[] = ( 7.787 * $item ) + ( 16 / 116 );
			}
		}
		$xyz = $xyz_new;

		$lab = array(
			'l' => ( 116 * $xyz['y'] ) - 16,
			'a' => 500 * ( $xyz['x'] - $xyz['y'] ),
			'b' => 200 * ( $xyz['y'] - $xyz['z'] ),
		);

		return $lab;
	}

	/**
	 * Convert color to integer
	 *
	 * @return int
	 */
	public function toInt() {
		return $this->color;
	}

	/**
	 * Alias of toString()
	 *
	 * @return string
	 */
	public function __toString() {
		return $this->toString();
	}

	/**
	 * Get color as string
	 *
	 * @return string
	 */
	public function toString() {
		$str = $this->toHex();
		return strtoupper( "#{$str}" );
	}

	/**
	 * Get the distance between this color and the given color
	 *
	 * @param Jetpack_Color $color Color code.
	 *
	 * @return int
	 */
	public function getDistanceRgbFrom( Jetpack_Color $color ) {
		$rgb1 = $this->toRgbInt();
		$rgb2 = $color->toRgbInt();

		$r_diff = abs( $rgb1['red'] - $rgb2['red'] );
		$g_diff = abs( $rgb1['green'] - $rgb2['green'] );
		$b_diff = abs( $rgb1['blue'] - $rgb2['blue'] );

		// Sum of RGB differences.
		$diff = $r_diff + $g_diff + $b_diff;
		return $diff;
	}

	/**
	 * Get distance from the given color using the Delta E method
	 *
	 * @param Jetpack_Color $color Color code.
	 *
	 * @return float
	 */
	public function getDistanceLabFrom( Jetpack_Color $color ) {
		$lab1 = $this->toLabCie();
		$lab2 = $color->toLabCie();

		$l_diff = abs( $lab2['l'] - $lab1['l'] );
		$a_diff = abs( $lab2['a'] - $lab1['a'] );
		$b_diff = abs( $lab2['b'] - $lab1['b'] );

		$delta = sqrt( $l_diff + $a_diff + $b_diff );

		return $delta;
	}

	/**
	 * Calculate luminosity.
	 *
	 * @return float
	 */
	public function toLuminosity() {
		$lum = array();
		foreach ( $this->toRgbInt() as $slot => $value ) {
			$chan         = $value / 255;
			$lum[ $slot ] = ( $chan <= 0.03928 ) ? $chan / 12.92 : pow( ( ( $chan + 0.055 ) / 1.055 ), 2.4 );
		}
		return 0.2126 * $lum['red'] + 0.7152 * $lum['green'] + 0.0722 * $lum['blue'];
	}

	/**
	 * Get distance between colors using luminance.
	 * Should be more than 5 for readable contrast
	 *
	 * @param  Jetpack_Color $color Another color.
	 * @return float
	 */
	public function getDistanceLuminosityFrom( Jetpack_Color $color ) {
		$l1 = $this->toLuminosity();
		$l2 = $color->toLuminosity();
		if ( $l1 > $l2 ) {
			return ( $l1 + 0.05 ) / ( $l2 + 0.05 );
		} else {
			return ( $l2 + 0.05 ) / ( $l1 + 0.05 );
		}
	}

	/**
	 * Get maximum contrast color.
	 *
	 * @return $this
	 */
	public function getMaxContrastColor() {
		$with_black = $this->getDistanceLuminosityFrom( new Jetpack_Color( '#000' ) );
		$with_white = $this->getDistanceLuminosityFrom( new Jetpack_Color( '#fff' ) );
		$color      = new Jetpack_Color();
		$hex        = ( $with_black >= $with_white ) ? '#000000' : '#ffffff';
		return $color->fromHex( $hex );
	}

	/**
	 * Get grayscale contrasting color.
	 *
	 * @param bool|int $contrast Contrast.
	 *
	 * @return $this
	 */
	public function getGrayscaleContrastingColor( $contrast = false ) {
		if ( ! $contrast ) {
			return $this->getMaxContrastColor();
		}
		// don't allow less than 5.
		$target_contrast = ( $contrast < 5 ) ? 5 : $contrast;
		$color           = $this->getMaxContrastColor();
		$contrast        = $color->getDistanceLuminosityFrom( $this );

		// if current max contrast is less than the target contrast, we had wishful thinking.
		if ( $contrast <= $target_contrast ) {
			return $color;
		}

		$incr = ( '#000000' === $color->toString() ) ? 1 : -1;
		while ( $contrast > $target_contrast ) {
			$color    = $color->incrementLightness( $incr );
			$contrast = $color->getDistanceLuminosityFrom( $this );
		}

		return $color;
	}

	/**
	 * Gets a readable contrasting color. $this is assumed to be the text and $color the background color.
	 *
	 * @param  object  $bg_color      A Color object that will be compared against $this.
	 * @param  integer $min_contrast The minimum contrast to achieve, if possible.
	 * @return object                A Color object, an increased contrast $this compared against $bg_color
	 */
	public function getReadableContrastingColor( $bg_color = false, $min_contrast = 5 ) {
		if ( ! $bg_color || ! is_a( $bg_color, 'Jetpack_Color' ) ) {
			return $this;
		}
		// you shouldn't use less than 5, but you might want to.
		$target_contrast = $min_contrast;
		// working things.
		$contrast           = $bg_color->getDistanceLuminosityFrom( $this );
		$max_contrast_color = $bg_color->getMaxContrastColor();
		$max_contrast       = $max_contrast_color->getDistanceLuminosityFrom( $bg_color );

		// if current max contrast is less than the target contrast, we had wishful thinking.
		// still, go max.
		if ( $max_contrast <= $target_contrast ) {
			return $max_contrast_color;
		}
		// or, we might already have sufficient contrast.
		if ( $contrast >= $target_contrast ) {
			return $this;
		}

		$incr = ( 0 === $max_contrast_color->toInt() ) ? -1 : 1;
		while ( $contrast < $target_contrast ) {
			$this->incrementLightness( $incr );
			$contrast = $bg_color->getDistanceLuminosityFrom( $this );
			// infininite loop prevention: you never know.
			if ( 0 === $this->color || 16777215 === $this->color ) {
				break;
			}
		}

		return $this;
	}

	/**
	 * Detect if color is grayscale
	 *
	 * @param int $threshold Max difference between colors.
	 *
	 * @return bool
	 */
	public function isGrayscale( $threshold = 16 ) {
		$rgb = $this->toRgbInt();

		// Get min and max rgb values, then difference between them.
		$rgb_min = min( $rgb );
		$rgb_max = max( $rgb );
		$diff    = $rgb_max - $rgb_min;

		return $diff < $threshold;
	}

	/**
	 * Get the closest matching color from the given array of colors
	 *
	 * @param array $colors array of integers or Jetpack_Color objects.
	 *
	 * @return mixed the array key of the matched color
	 */
	public function getClosestMatch( array $colors ) {
		$match_dist = 10000;
		$match_key  = null;
		foreach ( $colors as $key => $color ) {
			if ( false === ( $color instanceof Jetpack_Color ) ) {
				$c = new Jetpack_Color( $color );
			}
			$dist = $this->getDistanceLabFrom( $c );
			if ( $dist < $match_dist ) {
				$match_dist = $dist;
				$match_key  = $key;
			}
		}

		return $match_key;
	}

	/* TRANSFORMS */

	/**
	 * Transform -- Darken color.
	 *
	 * @param int $amount Amount. Default to 5.
	 *
	 * @return $this
	 */
	public function darken( $amount = 5 ) {
		return $this->incrementLightness( - $amount );
	}

	/**
	 * Transform -- Lighten color.
	 *
	 * @param int $amount Amount. Default to 5.
	 *
	 * @return $this
	 */
	public function lighten( $amount = 5 ) {
		return $this->incrementLightness( $amount );
	}

	/**
	 * Transform -- Increment lightness.
	 *
	 * @param int $amount Amount.
	 *
	 * @return $this
	 */
	public function incrementLightness( $amount ) {
		$hsl = $this->toHsl();

		$h = isset( $hsl['h'] ) ? $hsl['h'] : 0;
		$s = isset( $hsl['s'] ) ? $hsl['s'] : 0;
		$l = isset( $hsl['l'] ) ? $hsl['l'] : 0;

		$l += $amount;
		if ( $l < 0 ) {
			$l = 0;
		}
		if ( $l > 100 ) {
			$l = 100;
		}
		return $this->fromHsl( $h, $s, $l );
	}

	/**
	 * Transform -- Saturate color.
	 *
	 * @param int $amount Amount. Default to 15.
	 *
	 * @return $this
	 */
	public function saturate( $amount = 15 ) {
		return $this->incrementSaturation( $amount );
	}

	/**
	 * Transform -- Desaturate color.
	 *
	 * @param int $amount Amount. Default to 15.
	 *
	 * @return $this
	 */
	public function desaturate( $amount = 15 ) {
		return $this->incrementSaturation( - $amount );
	}

	/**
	 * Transform -- Increment saturation.
	 *
	 * @param int $amount Amount.
	 *
	 * @return $this
	 */
	public function incrementSaturation( $amount ) {
		$hsl = $this->toHsl();

		$h = isset( $hsl['h'] ) ? $hsl['h'] : 0;
		$s = isset( $hsl['s'] ) ? $hsl['s'] : 0;
		$l = isset( $hsl['l'] ) ? $hsl['l'] : 0;

		$s += $amount;
		if ( $s < 0 ) {
			$s = 0;
		}
		if ( $s > 100 ) {
			$s = 100;
		}
		return $this->fromHsl( $h, $s, $l );
	}

	/**
	 * Transform -- To grayscale.
	 *
	 * @return $this
	 */
	public function toGrayscale() {
		$hsl = $this->toHsl();

		$h = isset( $hsl['h'] ) ? $hsl['h'] : 0;
		$s = 0;
		$l = isset( $hsl['l'] ) ? $hsl['l'] : 0;

		return $this->fromHsl( $h, $s, $l );
	}

	/**
	 * Transform -- To the complementary color.
	 *
	 * The complement is the color on the opposite side of the color wheel, 180° away.
	 *
	 * @return $this
	 */
	public function getComplement() {
		return $this->incrementHue( 180 );
	}

	/**
	 * Transform -- To an analogous color of the complement.
	 *
	 * @param int $step Pass `1` or `-1` to choose which direction around the color wheel.
	 *
	 * @return $this
	 */
	public function getSplitComplement( $step = 1 ) {
		$incr = 180 + ( $step * 30 );
		return $this->incrementHue( $incr );
	}

	/**
	 * Transform -- To an analogous color.
	 *
	 * Analogous colors are those adjacent on the color wheel, separated by 30°.
	 *
	 * @param int $step Pass `1` or `-1` to choose which direction around the color wheel.
	 *
	 * @return $this
	 */
	public function getAnalog( $step = 1 ) {
		$incr = $step * 30;
		return $this->incrementHue( $incr );
	}

	/**
	 * Transform -- To a tetradic (rectangular) color.
	 *
	 * A rectangular color scheme uses a color, its complement, and the colors 60° from each.
	 * This transforms the color to its 60° "tetrad".
	 *
	 * @param int $step Pass `1` or `-1` to choose which direction around the color wheel.
	 *
	 * @return $this
	 */
	public function getTetrad( $step = 1 ) {
		$incr = $step * 60;
		return $this->incrementHue( $incr );
	}

	/**
	 * Transform -- To a triadic color.
	 *
	 * A triadic color scheme uses three colors evenly spaced (120°) around the color wheel.
	 * This transforms the color to one of its triadic colors.
	 *
	 * @param int $step Pass `1` or `-1` to choose which direction around the color wheel.
	 *
	 * @return $this
	 */
	public function getTriad( $step = 1 ) {
		$incr = $step * 120;
		return $this->incrementHue( $incr );
	}

	/**
	 * Transform -- Increment hue.
	 *
	 * @param int $amount Amount.
	 *
	 * @return $this
	 */
	public function incrementHue( $amount ) {
		$hsl = $this->toHsl();

		$h = isset( $hsl['h'] ) ? $hsl['h'] : 0;
		$s = isset( $hsl['s'] ) ? $hsl['s'] : 0;
		$l = isset( $hsl['l'] ) ? $hsl['l'] : 0;

		$h = ( $h + $amount ) % 360;
		if ( $h < 0 ) {
			$h += 360;
		}
		return $this->fromHsl( $h, $s, $l );
	}
}
