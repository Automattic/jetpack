<?php
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
 */

class Jetpack_Color {
	/**
	 * @var int
	 */
	protected $color = 0;

	/**
	 * Initialize object
	 *
	 * @param string|array $color A color of the type $type
	 * @param string $type The type of color we will construct from.
	 *  One of hex (default), rgb, hsl, int
	 */
	public function __construct( $color = null, $type = 'hex' ) {
		if ( $color ) {
			switch ( $type ) {
				case 'hex':
					$this->fromHex( $color );
					break;
				case 'rgb':
					if ( is_array( $color ) && count( $color ) == 3 ) {
						list( $r, $g, $b ) = array_values( $color );
						$this->fromRgbInt( $r, $g, $b );
					}
					break;
				case 'hsl':
					if ( is_array( $color ) && count( $color ) == 3 ) {
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
	 * @param string $hexValue
	 *
	 * @return Jetpack_Color
	 */
	public function fromHex($hexValue) {
		$hexValue = str_replace( '#', '', $hexValue );
		// handle short hex codes like #fff
		if ( 3 === strlen( $hexValue ) ) {
			$short = $hexValue;
			$i = 0;
			$hexValue = '';
			while ( $i < 3 ) {
				$chunk = substr($short, $i, 1 );
				$hexValue .= $chunk . $chunk;
				$i++;
			}
		}
		$intValue = hexdec( $hexValue );

		if ( $intValue < 0 || $intValue > 16777215 ) {
			throw new RangeException( $hexValue . " out of valid color code range" );
		}

		$this->color = $intValue;

		return $this;
	}

	/**
	 * Init color from integer RGB values
	 *
	 * @param int $red
	 * @param int $green
	 * @param int $blue
	 *
	 * @return Jetpack_Color
	 */
	public function fromRgbInt($red, $green, $blue)
	{
		if ( $red < 0 || $red > 255 )
			throw new RangeException( "Red value " . $red . " out of valid color code range" );

		if ( $green < 0 || $green > 255 )
			throw new RangeException( "Green value " . $green . " out of valid color code range" );

		if ( $blue < 0 || $blue > 255 )
			throw new RangeException( "Blue value " . $blue . " out of valid color code range" );

		$this->color = (int)(($red << 16) + ($green << 8) + $blue);

		return $this;
	}

	/**
	 * Init color from hex RGB values
	 *
	 * @param string $red
	 * @param string $green
	 * @param string $blue
	 *
	 * @return Jetpack_Color
	 */
	public function fromRgbHex($red, $green, $blue)
	{
		return $this->fromRgbInt(hexdec($red), hexdec($green), hexdec($blue));
	}

	/**
	 * Converts an HSL color value to RGB. Conversion formula
	 * adapted from https://en.wikipedia.org/wiki/HSL_color_space.
	 * @param  int $h Hue. [0-360]
	 * @param  in $s Saturation [0, 100]
	 * @param  int $l Lightness [0, 100]
	 */
	public function fromHsl( $h, $s, $l ) {
		$h /= 360; $s /= 100; $l /= 100;

		if ( $s == 0 ) {
			$r = $g = $b = $l; // achromatic
		}
		else {
			$q = $l < 0.5 ? $l * ( 1 + $s ) : $l + $s - $l * $s;
			$p = 2 * $l - $q;
			$r = $this->hue2rgb( $p, $q, $h + 1/3 );
			$g = $this->hue2rgb( $p, $q, $h );
			$b = $this->hue2rgb( $p, $q, $h - 1/3 );
		}

		return $this->fromRgbInt( $r * 255, $g * 255, $b * 255 );
	}

	/**
	 * Helper function for Jetpack_Color::fromHsl()
	 */
	private function hue2rgb( $p, $q, $t ) {
		if ( $t < 0 ) $t += 1;
		if ( $t > 1 ) $t -= 1;
		if ( $t < 1/6 ) return $p + ( $q - $p ) * 6 * $t;
		if ( $t < 1/2 ) return $q;
		if ( $t < 2/3 ) return $p + ( $q - $p ) * ( 2/3 - $t ) * 6;
		return $p;
	}

	/**
	 * Init color from integer value
	 *
	 * @param int $intValue
	 *
	 * @return Jetpack_Color
	 */
	public function fromInt($intValue)
	{
		if ( $intValue < 0 || $intValue > 16777215 )
			throw new RangeException( $intValue . " out of valid color code range" );

		$this->color = $intValue;

		return $this;
	}

	/**
	 * Convert color to hex
	 *
	 * @return string
	 */
	public function toHex()
	{
		return str_pad(dechex($this->color), 6, '0', STR_PAD_LEFT);
	}

	/**
	 * Convert color to RGB array (integer values)
	 *
	 * @return array
	 */
	public function toRgbInt()
	{
		return array(
			'red'   => (int)(255 & ($this->color >> 16)),
			'green' => (int)(255 & ($this->color >> 8)),
			'blue'  => (int)(255 & ($this->color))
		);
	}

	/**
	 * Convert color to RGB array (hex values)
	 *
	 * @return array
	 */
	public function toRgbHex()
	{
		$r = array();
		foreach ($this->toRgbInt() as $item) {
			$r[] = dechex($item);
		}
		return $r;
	}

	/**
	 * Get Hue/Saturation/Value for the current color
	 * (float values, slow but accurate)
	 *
	 * @return array
	 */
	public function toHsvFloat()
	{
		$rgb = $this->toRgbInt();

		$rgbMin = min($rgb);
		$rgbMax = max($rgb);

		$hsv = array(
			'hue'   => 0,
			'sat'   => 0,
			'val'   => $rgbMax
		);

		// If v is 0, color is black
		if ($hsv['val'] == 0) {
			return $hsv;
		}

		// Normalize RGB values to 1
		$rgb['red'] /= $hsv['val'];
		$rgb['green'] /= $hsv['val'];
		$rgb['blue'] /= $hsv['val'];
		$rgbMin = min($rgb);
		$rgbMax = max($rgb);

		// Calculate saturation
		$hsv['sat'] = $rgbMax - $rgbMin;
		if ($hsv['sat'] == 0) {
			$hsv['hue'] = 0;
			return $hsv;
		}

		// Normalize saturation to 1
		$rgb['red'] = ($rgb['red'] - $rgbMin) / ($rgbMax - $rgbMin);
		$rgb['green'] = ($rgb['green'] - $rgbMin) / ($rgbMax - $rgbMin);
		$rgb['blue'] = ($rgb['blue'] - $rgbMin) / ($rgbMax - $rgbMin);
		$rgbMin = min($rgb);
		$rgbMax = max($rgb);

		// Calculate hue
		if ($rgbMax == $rgb['red']) {
			$hsv['hue'] = 0.0 + 60 * ($rgb['green'] - $rgb['blue']);
			if ($hsv['hue'] < 0) {
				$hsv['hue'] += 360;
			}
		} else if ($rgbMax == $rgb['green']) {
			$hsv['hue'] = 120 + (60 * ($rgb['blue'] - $rgb['red']));
		} else {
			$hsv['hue'] = 240 + (60 * ($rgb['red'] - $rgb['green']));
		}

		return $hsv;
	}

	/**
	 * Get HSV values for color
	 * (integer values from 0-255, fast but less accurate)
	 *
	 * @return int
	 */
	public function toHsvInt()
	{
		$rgb = $this->toRgbInt();

		$rgbMin = min($rgb);
		$rgbMax = max($rgb);

		$hsv = array(
			'hue'   => 0,
			'sat'   => 0,
			'val'   => $rgbMax
		);

		// If value is 0, color is black
		if ($hsv['val'] == 0) {
			return $hsv;
		}

		// Calculate saturation
		$hsv['sat'] = round(255 * ($rgbMax - $rgbMin) / $hsv['val']);
		if ($hsv['sat'] == 0) {
			$hsv['hue'] = 0;
			return $hsv;
		}

		// Calculate hue
		if ($rgbMax == $rgb['red']) {
			$hsv['hue'] = round(0 + 43 * ($rgb['green'] - $rgb['blue']) / ($rgbMax - $rgbMin));
		} else if ($rgbMax == $rgb['green']) {
			$hsv['hue'] = round(85 + 43 * ($rgb['blue'] - $rgb['red']) / ($rgbMax - $rgbMin));
		} else {
			$hsv['hue'] = round(171 + 43 * ($rgb['red'] - $rgb['green']) / ($rgbMax - $rgbMin));
		}
		if ($hsv['hue'] < 0) {
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
	 * @return  Array		   The HSL representation
	 */
	public function toHsl() {
		list( $r, $g, $b ) = array_values( $this->toRgbInt() );
		$r /= 255; $g /= 255; $b /= 255;
		$max = max( $r, $g, $b );
		$min = min( $r, $g, $b );
		$h = $s = $l = ( $max + $min ) / 2;
		#var_dump( array( compact('max', 'min', 'r', 'g', 'b')) );
		if ( $max == $min ) {
			$h = $s = 0; // achromatic
		}
		else {
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

	public function toCSS( $type = 'hex', $alpha = 1 ) {
		switch ( $type ) {
			case 'hex':
				return $this->toString();
				break;
			case 'rgb':
			case 'rgba':
				list( $r, $g, $b ) = array_values( $this->toRgbInt() );
				if ( is_numeric( $alpha ) && $alpha < 1 ) {
					return "rgba( {$r}, {$g}, {$b}, $alpha )";
				}
				else {
					return "rgb( {$r}, {$g}, {$b} )";
				}
				break;
			case 'hsl':
			case 'hsla':
				list( $h, $s, $l ) = array_values( $this->toHsl() );
				if ( is_numeric( $alpha ) && $alpha < 1 ) {
					return "hsla( {$h}, {$s}, {$l}, $alpha )";
				}
				else {
					return "hsl( {$h}, {$s}, {$l} )";
				}
				break;
			default:
				return $this->toString();
				break;
		}
	}

	/**
	 * Get current color in XYZ format
	 *
	 * @return array
	 */
	public function toXyz()
	{
		$rgb = $this->toRgbInt();

		// Normalize RGB values to 1

		$rgb_new = array();
		foreach ($rgb as $item) {
			$rgb_new[] = $item / 255;
		}
		$rgb = $rgb_new;

		$rgb_new = array();
		foreach ($rgb as $item) {
			if ($item > 0.04045) {
				$item = pow((($item + 0.055) / 1.055), 2.4);
			} else {
				$item = $item / 12.92;
			}
			$rgb_new[] = $item * 100;
		}
		$rgb = $rgb_new;

		// Observer. = 2°, Illuminant = D65
		$xyz = array(
			'x' => ($rgb['red'] * 0.4124) + ($rgb['green'] * 0.3576) + ($rgb['blue'] * 0.1805),
			'y' => ($rgb['red'] * 0.2126) + ($rgb['green'] * 0.7152) + ($rgb['blue'] * 0.0722),
			'z' => ($rgb['red'] * 0.0193) + ($rgb['green'] * 0.1192) + ($rgb['blue'] * 0.9505)
		);

		return $xyz;
	}

	/**
	 * Get color CIE-Lab values
	 *
	 * @return array
	 */
	public function toLabCie()
	{
		$xyz = $this->toXyz();

		//Ovserver = 2*, Iluminant=D65
		$xyz['x'] /= 95.047;
		$xyz['y'] /= 100;
		$xyz['z'] /= 108.883;

		$xyz_new = array();
		foreach ($xyz as $item) {
			if ($item > 0.008856) {
				$xyz_new[] = pow($item, 1/3);
			} else {
				$xyz_new[] = (7.787 * $item) + (16 / 116);
			}
		}
		$xyz = $xyz_new;

		$lab = array(
			'l' => (116 * $xyz['y']) - 16,
			'a' => 500 * ($xyz['x'] - $xyz['y']),
			'b' => 200 * ($xyz['y'] - $xyz['z'])
		);

		return $lab;
	}

	/**
	 * Convert color to integer
	 *
	 * @return int
	 */
	public function toInt()
	{
		return $this->color;
	}

	/**
	 * Alias of toString()
	 *
	 * @return string
	 */
	public function __toString()
	{
		return $this->toString();
	}

	/**
	 * Get color as string
	 *
	 * @return string
	 */
	public function toString()
	{
		$str = $this->toHex();
		return strtoupper("#{$str}");
	}

	/**
	 * Get the distance between this color and the given color
	 *
	 * @param Jetpack_Color $color
	 *
	 * @return int
	 */
	public function getDistanceRgbFrom(Jetpack_Color $color)
	{
		$rgb1 = $this->toRgbInt();
		$rgb2 = $color->toRgbInt();

		$rDiff = abs($rgb1['red'] - $rgb2['red']);
		$gDiff = abs($rgb1['green'] - $rgb2['green']);
		$bDiff = abs($rgb1['blue'] - $rgb2['blue']);

		// Sum of RGB differences
		$diff = $rDiff + $gDiff + $bDiff;
		return $diff;
	}

	/**
	 * Get distance from the given color using the Delta E method
	 *
	 * @param Jetpack_Color $color
	 *
	 * @return float
	 */
	public function getDistanceLabFrom(Jetpack_Color $color)
	{
		$lab1 = $this->toLabCie();
		$lab2 = $color->toLabCie();

		$lDiff = abs($lab2['l'] - $lab1['l']);
		$aDiff = abs($lab2['a'] - $lab1['a']);
		$bDiff = abs($lab2['b'] - $lab1['b']);

		$delta = sqrt($lDiff + $aDiff + $bDiff);

		return $delta;
	}

	public function toLuminosity() {
		$lum = array();
		foreach( $this->toRgbInt() as $slot => $value ) {
			$chan = $value / 255;
			$lum[ $slot ] = ( $chan <= 0.03928 ) ? $chan / 12.92 : pow( ( ( $chan + 0.055 ) / 1.055 ), 2.4 );
		}
		return 0.2126 * $lum['red'] + 0.7152 * $lum['green'] + 0.0722 * $lum['blue'];
	}

	/**
	 * Get distance between colors using luminance.
	 * Should be more than 5 for readable contrast
	 *
	 * @param  Jetpack_Color  $color Another color
	 * @return float
	 */
	public function getDistanceLuminosityFrom( Jetpack_Color $color ) {
		$L1 = $this->toLuminosity();
		$L2 = $color->toLuminosity();
		if ( $L1 > $L2 ) {
			return ( $L1 + 0.05 ) / ( $L2 + 0.05 );
		}
		else{
			return ( $L2 + 0.05 ) / ( $L1 + 0.05 );
		}
	}

	public function getMaxContrastColor() {
		$withBlack = $this->getDistanceLuminosityFrom( new Jetpack_Color( '#000') );
		$withWhite = $this->getDistanceLuminosityFrom( new Jetpack_Color( '#fff') );
		$color = new Jetpack_Color;
		$hex = ( $withBlack >= $withWhite ) ? '#000000' : '#ffffff';
		return $color->fromHex( $hex );
	}

	public function getGrayscaleContrastingColor( $contrast = false ) {
		if ( ! $contrast ) {
			return $this->getMaxContrastColor();
		}
		// don't allow less than 5
		$target_contrast = ( $contrast < 5 ) ? 5 : $contrast;
		$color = $this->getMaxContrastColor();
		$contrast = $color->getDistanceLuminosityFrom( $this );

		// if current max contrast is less than the target contrast, we had wishful thinking.
		if ( $contrast <= $target_contrast ) {
			return $color;
		}

		$incr = ( '#000000' === $color->toString() ) ? 1 : -1;
		while ( $contrast > $target_contrast ) {
			$color = $color->incrementLightness( $incr );
			$contrast = $color->getDistanceLuminosityFrom( $this );
		}

		return $color;
	}

	/**
	 * Gets a readable contrasting color. $this is assumed to be the text and $color the background color.
	 * @param  object $bg_color      A Color object that will be compared against $this
	 * @param  integer $min_contrast The minimum contrast to achieve, if possible.
	 * @return object                A Color object, an increased contrast $this compared against $bg_color
	 */
	public function getReadableContrastingColor( $bg_color = false, $min_contrast = 5 ) {
		if ( ! $bg_color || ! is_a( $bg_color, 'Jetpack_Color' ) ) {
			return $this;
		}
		// you shouldn't use less than 5, but you might want to.
		$target_contrast = $min_contrast;
		// working things
		$contrast = $bg_color->getDistanceLuminosityFrom( $this );
		$max_contrast_color = $bg_color->getMaxContrastColor();
		$max_contrast = $max_contrast_color->getDistanceLuminosityFrom( $bg_color );

		// if current max contrast is less than the target contrast, we had wishful thinking.
		// still, go max
		if ( $max_contrast <= $target_contrast ) {
			return $max_contrast_color;
		}
		// or, we might already have sufficient contrast
		if ( $contrast >= $target_contrast ) {
			return $this;
		}

		$incr = ( 0 === $max_contrast_color->toInt() ) ? -1 : 1;
		while ( $contrast < $target_contrast ) {
			$this->incrementLightness( $incr );
			$contrast = $bg_color->getDistanceLuminosityFrom( $this );
			// infininite loop prevention: you never know.
			if ( $this->color === 0 || $this->color === 16777215 ) {
				break;
			}
		}

		return $this;
	}

	/**
	 * Detect if color is grayscale
	 *
	 * @param int @threshold
	 *
	 * @return bool
	 */
	public function isGrayscale($threshold = 16)
	{
		$rgb = $this->toRgbInt();

		// Get min and max rgb values, then difference between them
		$rgbMin = min($rgb);
		$rgbMax = max($rgb);
		$diff = $rgbMax - $rgbMin;

		return $diff < $threshold;
	}

	/**
	 * Get the closest matching color from the given array of colors
	 *
	 * @param array $colors array of integers or Jetpack_Color objects
	 *
	 * @return mixed the array key of the matched color
	 */
	public function getClosestMatch(array $colors)
	{
		$matchDist = 10000;
		$matchKey = null;
		foreach($colors as $key => $color) {
			if (false === ($color instanceof Jetpack_Color)) {
				$c = new Jetpack_Color($color);
			}
			$dist = $this->getDistanceLabFrom($c);
			if ($dist < $matchDist) {
				$matchDist = $dist;
				$matchKey = $key;
			}
		}

		return $matchKey;
	}

	/* TRANSFORMS */

	public function darken( $amount = 5 ) {
		return $this->incrementLightness( - $amount );
	}

	public function lighten( $amount = 5 ) {
		return $this->incrementLightness( $amount );
	}

	public function incrementLightness( $amount ) {
		$hsl = $this->toHsl();
		extract( $hsl );
		$l += $amount;
		if ( $l < 0 ) $l = 0;
		if ( $l > 100 ) $l = 100;
		return $this->fromHsl( $h, $s, $l );
	}

	public function saturate( $amount = 15 ) {
		return $this->incrementSaturation( $amount );
	}

	public function desaturate( $amount = 15 ) {
		return $this->incrementSaturation( - $amount );
	}

	public function incrementSaturation( $amount ) {
		$hsl = $this->toHsl();
		extract( $hsl );
		$s += $amount;
		if ( $s < 0 ) $s = 0;
		if ( $s > 100 ) $s = 100;
		return $this->fromHsl( $h, $s, $l );
	}

	public function toGrayscale() {
		$hsl = $this->toHsl();
		extract( $hsl );
		$s = 0;
		return $this->fromHsl( $h, $s, $l );
	}

	public function getComplement() {
		return $this->incrementHue( 180 );
	}

	public function getSplitComplement( $step = 1 ) {
		$incr = 180 + ( $step * 30 );
		return $this->incrementHue( $incr );
	}

	public function getAnalog( $step = 1 ) {
		$incr = $step * 30;
		return $this->incrementHue( $incr );
	}

	public function getTetrad( $step = 1 ) {
		$incr = $step * 60;
		return $this->incrementHue( $incr );
	}

	public function getTriad( $step = 1 ) {
		$incr = $step * 120;
		return $this->incrementHue( $incr );
	}

	public function incrementHue( $amount ) {
		$hsl = $this->toHsl();
		extract( $hsl );
		$h = ( $h + $amount ) % 360;
		if ( $h < 0 ) $h = 360 - $h;
		return $this->fromHsl( $h, $s, $l );
	}

} // class Jetpack_Color
