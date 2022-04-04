<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * CSSTidy - CSS Parser and Optimiser
 *
 * CSS Optimising Class
 * This class optimises CSS data generated by csstidy.
 *
 * Copyright 2005, 2006, 2007 Florian Schmitz
 *
 * This file is part of CSSTidy.
 *
 *   CSSTidy is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation; either version 2.1 of the License, or
 *   (at your option) any later version.
 *
 *   CSSTidy is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * @license https://opensource.org/licenses/lgpl-license.php GNU Lesser General Public License
 * @package csstidy
 * @author Florian Schmitz (floele at gmail dot com) 2005-2007
 * @author Brett Zamir (brettz9 at yahoo dot com) 2007
 * @author Nikolay Matsievsky (speed at webo dot name) 2009-2010
 */

/**
 * CSS Optimising Class
 *
 * This class optimises CSS data generated by csstidy.
 *
 * @package csstidy
 * @author Florian Schmitz (floele at gmail dot com) 2005-2006
 * @version 1.0
 */
class csstidy_optimise { // phpcs:ignore
	/**
	 * Constructor
	 *
	 * @param array $css contains the class csstidy.
	 * @access private
	 * @version 1.0
	 */
	public function __construct( &$css ) {
		$this->parser    = & $css;
		$this->css       = & $css->css;
		$this->sub_value = & $css->sub_value;
		$this->at        = & $css->at;
		$this->selector  = & $css->selector;
		$this->property  = & $css->property;
		$this->value     = & $css->value;
	}

	/**
	 * Call constructor function.
	 *
	 * @param object $css - the CSS.
	 */
	public function csstidy_optimise( &$css ) {
		$this->__construct( $css );
	}

	/**
	 * Optimises $css after parsing
	 *
	 * @access public
	 * @version 1.0
	 */
	public function postparse() {
		if ( $this->parser->get_cfg( 'preserve_css' ) ) {
			return;
		}

		if ( $this->parser->get_cfg( 'merge_selectors' ) === 2 ) {
			foreach ( $this->css as $medium => $value ) {
				$this->merge_selectors( $this->css[ $medium ] );
			}
		}

		if ( $this->parser->get_cfg( 'discard_invalid_selectors' ) ) {
			foreach ( $this->css as $medium => $value ) {
				$this->discard_invalid_selectors( $this->css[ $medium ] );
			}
		}

		if ( $this->parser->get_cfg( 'optimise_shorthands' ) > 0 ) {
			foreach ( $this->css as $medium => $value ) {
				foreach ( $value as $selector => $value1 ) {
					$this->css[ $medium ][ $selector ] = self::merge_4value_shorthands( $this->css[ $medium ][ $selector ] );

					if ( $this->parser->get_cfg( 'optimise_shorthands' ) < 2 ) {
						continue;
					}

					$this->css[ $medium ][ $selector ] = self::merge_font( $this->css[ $medium ][ $selector ] );

					if ( $this->parser->get_cfg( 'optimise_shorthands' ) < 3 ) {
						continue;
					}

					$this->css[ $medium ][ $selector ] = self::merge_bg( $this->css[ $medium ][ $selector ] );
					if ( empty( $this->css[ $medium ][ $selector ] ) ) {
						unset( $this->css[ $medium ][ $selector ] );
					}
				}
			}
		}
	}

	/**
	 * Optimises values
	 *
	 * @access public
	 * @version 1.0
	 */
	public function value() {
		$shorthands = & $GLOBALS['csstidy']['shorthands'];

		// optimise shorthand properties.
		if ( isset( $shorthands[ $this->property ] ) ) {
			$temp = self::shorthand( $this->value ); // FIXME - move.
			if ( $temp !== $this->value ) {
				$this->parser->log( 'Optimised shorthand notation (' . $this->property . '): Changed "' . $this->value . '" to "' . $temp . '"', 'Information' );
			}
			$this->value = $temp;
		}

		// Remove whitespace at ! important.
		if ( $this->value !== $this->compress_important( $this->value ) ) {
			$this->parser->log( 'Optimised !important', 'Information' );
		}
	}

	/**
	 * Optimises shorthands
	 *
	 * @access public
	 * @version 1.0
	 */
	public function shorthands() {
		$shorthands = & $GLOBALS['csstidy']['shorthands'];

		if ( ! $this->parser->get_cfg( 'optimise_shorthands' ) || $this->parser->get_cfg( 'preserve_css' ) ) {
			return;
		}

		if ( $this->property === 'font' && $this->parser->get_cfg( 'optimise_shorthands' ) > 1 ) {
			$this->css[ $this->at ][ $this->selector ]['font'] = '';
			$this->parser->merge_css_blocks( $this->at, $this->selector, self::dissolve_short_font( $this->value ) );
		}
		if ( $this->property === 'background' && $this->parser->get_cfg( 'optimise_shorthands' ) > 2 ) {
			$this->css[ $this->at ][ $this->selector ]['background'] = '';
			$this->parser->merge_css_blocks( $this->at, $this->selector, self::dissolve_short_bg( $this->value ) );
		}
		if ( isset( $shorthands[ $this->property ] ) ) {
			$this->parser->merge_css_blocks( $this->at, $this->selector, self::dissolve_4value_shorthands( $this->property, $this->value ) );
			if ( is_array( $shorthands[ $this->property ] ) ) {
				$this->css[ $this->at ][ $this->selector ][ $this->property ] = '';
			}
		}
	}

	/**
	 * Optimises a sub-value
	 *
	 * @access public
	 * @version 1.0
	 */
	public function subvalue() {
		$replace_colors = & $GLOBALS['csstidy']['replace_colors'];

		$this->sub_value = trim( $this->sub_value );
		if ( $this->sub_value === '' ) {
			return;
		}

		$important = '';
		if ( csstidy::is_important( $this->sub_value ) ) {
			$important = '!important';
		}
		$this->sub_value = csstidy::gvw_important( $this->sub_value );

		// Compress font-weight.
		if ( $this->property === 'font-weight' && $this->parser->get_cfg( 'compress_font-weight' ) ) {
			if ( $this->sub_value === 'bold' ) {
				$this->sub_value = '700';
				$this->parser->log( 'Optimised font-weight: Changed "bold" to "700"', 'Information' );
			} elseif ( $this->sub_value === 'normal' ) {
				$this->sub_value = '400';
				$this->parser->log( 'Optimised font-weight: Changed "normal" to "400"', 'Information' );
			}
		}

		$temp = $this->compress_numbers( $this->sub_value );
		if ( strcasecmp( $temp, $this->sub_value ) !== 0 ) {
			if ( strlen( $temp ) > strlen( $this->sub_value ) ) {
				$this->parser->log( 'Fixed invalid number: Changed "' . $this->sub_value . '" to "' . $temp . '"', 'Warning' );
			} else {
				$this->parser->log( 'Optimised number: Changed "' . $this->sub_value . '" to "' . $temp . '"', 'Information' );
			}
			$this->sub_value = $temp;
		}
		if ( $this->parser->get_cfg( 'compress_colors' ) ) {
			$temp = $this->cut_color( $this->sub_value );
			if ( $temp !== $this->sub_value ) {
				if ( isset( $replace_colors[ $this->sub_value ] ) ) {
					$this->parser->log( 'Fixed invalid color name: Changed "' . $this->sub_value . '" to "' . $temp . '"', 'Warning' );
				} else {
					$this->parser->log( 'Optimised color: Changed "' . $this->sub_value . '" to "' . $temp . '"', 'Information' );
				}
				$this->sub_value = $temp;
			}
		}
		$this->sub_value .= $important;
	}

	/**
	 * Compresses shorthand values. Example: margin:1px 1px 1px 1px -> margin:1px
	 *
	 * @param string $value - the value.
	 * @access public
	 * @return string
	 * @version 1.0
	 */
	public static function shorthand( $value ) {
		$important = '';
		if ( csstidy::is_important( $value ) ) {
			$values    = csstidy::gvw_important( $value );
			$important = '!important';
		} else {
			$values = $value;
		}

		$values = explode( ' ', $values );
		switch ( count( $values ) ) {
			case 4:
				if ( $values[0] === $values[1] && $values[0] === $values[2] && $values[0] === $values[3] ) {
					return $values[0] . $important;
				} elseif ( $values[1] === $values[3] && $values[0] === $values[2] ) {
					return $values[0] . ' ' . $values[1] . $important;
				} elseif ( $values[1] === $values[3] ) {
					return $values[0] . ' ' . $values[1] . ' ' . $values[2] . $important;
				}
				break;

			case 3:
				if ( $values[0] === $values[1] && $values[0] === $values[2] ) {
					return $values[0] . $important;
				} elseif ( $values[0] === $values[2] ) {
					return $values[0] . ' ' . $values[1] . $important;
				}
				break;

			case 2:
				if ( $values[0] === $values[1] ) {
					return $values[0] . $important;
				}
				break;
		}

		return $value;
	}

	/**
	 * Removes unnecessary whitespace in ! important
	 *
	 * @param string $string - the string.
	 * @return string
	 * @access public
	 * @version 1.1
	 */
	public function compress_important( &$string ) {
		if ( csstidy::is_important( $string ) ) {
			$string = csstidy::gvw_important( $string ) . ' !important';      }
		return $string;
	}

	/**
	 * Color compression function. Converts all rgb() values to #-values and uses the short-form if possible. Also replaces 4 color names by #-values.
	 *
	 * @param string $color - the color.
	 * @return string
	 * @version 1.1
	 */
	public function cut_color( $color ) {
		$replace_colors = & $GLOBALS['csstidy']['replace_colors'];

		// an example: rgb(0,0,0) -> #000000 (or #000 in this case later).
		if ( strtolower( substr( $color, 0, 4 ) ) === 'rgb(' ) {
			$color_tmp = substr( $color, 4, strlen( $color ) - 5 );
			$color_tmp = explode( ',', $color_tmp );
			for ( $i = 0, $l = count( $color_tmp ); $i < $l; $i++ ) {
				$color_tmp[ $i ] = trim( $color_tmp[ $i ] );
				if ( substr( $color_tmp[ $i ], -1 ) === '%' ) {
					$color_tmp[ $i ] = round( ( 255 * $color_tmp[ $i ] ) / 100 );
				}
				if ( $color_tmp[ $i ] > 255 ) {
					$color_tmp[ $i ] = 255;
				}
			}
			$color = '#';
			for ( $i = 0; $i < 3; $i++ ) {
				if ( $color_tmp[ $i ] < 16 ) {
					$color .= '0' . dechex( $color_tmp[ $i ] );
				} else {
					$color .= dechex( $color_tmp[ $i ] );
				}
			}
		}

		// Fix bad color names.
		if ( isset( $replace_colors[ strtolower( $color ) ] ) ) {
			$color = $replace_colors[ strtolower( $color ) ];
		}

		// #aabbcc -> #abc
		if ( strlen( $color ) === 7 ) {
			$color_temp = strtolower( $color );
			if ( $color_temp[0] === '#' && $color_temp[1] === $color_temp[2] && $color_temp[3] === $color_temp[4] && $color_temp[5] === $color_temp[6] ) {
				$color = '#' . $color[1] . $color[3] . $color[5];
			}
		}

		switch ( strtolower( $color ) ) {
			/* color name -> hex code */
			case 'black':
				return '#000';
			case 'fuchsia':
				return '#f0f';
			case 'white':
				return '#fff';
			case 'yellow':
				return '#ff0';

			/* hex code -> color name */
			case '#800000':
				return 'maroon';
			case '#ffa500':
				return 'orange';
			case '#808000':
				return 'olive';
			case '#800080':
				return 'purple';
			case '#008000':
				return 'green';
			case '#000080':
				return 'navy';
			case '#008080':
				return 'teal';
			case '#c0c0c0':
				return 'silver';
			case '#808080':
				return 'gray';
			case '#f00':
				return 'red';
		}

		return $color;
	}

	/**
	 * Compresses numbers (ie. 1.0 becomes 1 or 1.100 becomes 1.1 )
	 *
	 * @param string $subvalue - the subvalue.
	 * @return string
	 * @version 1.2
	 */
	public function compress_numbers( $subvalue ) {
		$unit_values  = & $GLOBALS['csstidy']['unit_values'];
		$color_values = & $GLOBALS['csstidy']['color_values'];

		// for font:1em/1em sans-serif...;.
		if ( $this->property === 'font' ) {
			$temp = explode( '/', $subvalue );
		} else {
			$temp = array( $subvalue );
		}

		for ( $l = 0, $m = count( $temp ); $l < $m; $l++ ) {
			// if we are not dealing with a number at this point, do not optimise anything.
			$number = $this->analyse_css_number( $temp[ $l ] );
			if ( $number === false ) {
				return $subvalue;
			}

			// Fix bad colors.
			if ( in_array( $this->property, $color_values, true ) ) {
				if ( strlen( $temp[ $l ] ) === 3 || strlen( $temp[ $l ] ) === 6 ) {
					$temp[ $l ] = '#' . $temp[ $l ];
				} else {
					$temp[ $l ] = '0';
				}
				continue;
			}

			if ( abs( $number[0] ) > 0 ) {
				if ( $number[1] === '' && in_array( $this->property, $unit_values, true ) ) {
					$number[1] = 'px';
				}
			} else {
				$number[1] = '';
			}

			$temp[ $l ] = $number[0] . $number[1];
		}

		return ( ( count( $temp ) > 1 ) ? $temp[0] . '/' . $temp[1] : $temp[0] );
	}

	/**
	 * Checks if a given string is a CSS valid number. If it is,
	 * an array containing the value and unit is returned
	 *
	 * @param string $string - the string we're checking.
	 * @return array ('unit' if unit is found or '' if no unit exists, number value) or false if no number
	 */
	public function analyse_css_number( $string ) {
		// most simple checks first
		if ( $string === '' || ctype_alpha( $string[0] ) ) {
			return false;
		}

		$units  = & $GLOBALS['csstidy']['units'];
		$return = array( 0, '' );

		$return[0] = (float) $string;
		if ( abs( $return[0] ) > 0 && abs( $return[0] ) < 1 ) {
			// Removes the initial `0` from a decimal number, e.g., `0.7 => .7` or `-0.666 => -.666`.
			if ( ! $this->parser->get_cfg( 'preserve_leading_zeros' ) ) {
				if ( $return[0] < 0 ) {
					$return[0] = '-' . ltrim( substr( $return[0], 1 ), '0' );
				} else {
					$return[0] = ltrim( $return[0], '0' );
				}
			}
		}

		// Look for unit and split from value if exists
		foreach ( $units as $unit ) {
			$expect_unit_at = strlen( $string ) - strlen( $unit );
			$unit_in_string = stristr( $string, $unit );
			if ( ! $unit_in_string ) { // mb_strpos() fails with "false"
				continue;
			}
			$actual_position = strpos( $string, $unit_in_string );
			if ( $expect_unit_at === $actual_position ) {
				$return[1] = $unit;
				$string    = substr( $string, 0, - strlen( $unit ) );
				break;
			}
		}
		if ( ! is_numeric( $string ) ) {
			return false;
		}
		return $return;
	}

	/**
	 * Merges selectors with same properties. Example: a{color:red} b{color:red} -> a,b{color:red}
	 * Very basic and has at least one bug. Hopefully there is a replacement soon.
	 *
	 * @param array $array - the selector array.
	 * @access public
	 * @version 1.2
	 */
	public function merge_selectors( &$array ) {
		$css = $array;
		foreach ( $css as $key => $value ) {
			if ( ! isset( $css[ $key ] ) ) {
				continue;
			}
			$newsel = '';

			// Check if properties also exist in another selector.
			$keys = array();
			// PHP bug (?) without $css = $array; here.
			foreach ( $css as $selector => $vali ) {
				if ( $selector === $key ) {
					continue;
				}

				if ( $css[ $key ] === $vali ) {
					$keys[] = $selector;
				}
			}

			if ( ! empty( $keys ) ) {
				$newsel = $key;
				unset( $css[ $key ] );
				foreach ( $keys as $selector ) {
					unset( $css[ $selector ] );
					$newsel .= ',' . $selector;
				}
				$css[ $newsel ] = $value;
			}
		}
		$array = $css;
	}

	/**
	 * Removes invalid selectors and their corresponding rule-sets as
	 * defined by 4.1.7 in REC-CSS2. This is a very rudimentary check
	 * and should be replaced by a full-blown parsing algorithm or
	 * regular expression
	 *
	 * @version 1.4
	 *
	 * @param array $array - selector array.
	 */
	public function discard_invalid_selectors( &$array ) {
		foreach ( $array as $selector => $decls ) {
			$ok        = true;
			$selectors = array_map( 'trim', explode( ',', $selector ) );
			foreach ( $selectors as $s ) {
				$simple_selectors = preg_split( '/\s*[+>~\s]\s*/', $s );
				foreach ( $simple_selectors as $ss ) {
					if ( $ss === '' ) {
						$ok = false;
					}
					// could also check $ss for internal structure, but that probably would be too slow.
				}
			}
			if ( ! $ok ) {
				unset( $array[ $selector ] );
			}
		}
	}

	/**
	 * Dissolves properties like padding:10px 10px 10px to padding-top:10px;padding-bottom:10px;...
	 *
	 * @param string $property - the property.
	 * @param string $value - the value.
	 * @return array
	 * @version 1.0
	 * @see merge_4value_shorthands()
	 */
	public static function dissolve_4value_shorthands( $property, $value ) {
		$shorthands = & $GLOBALS['csstidy']['shorthands'];
		if ( ! is_array( $shorthands[ $property ] ) ) {
			$return              = array();
			$return[ $property ] = $value;
			return $return;
		}

		$important = '';
		if ( csstidy::is_important( $value ) ) {
			$value     = csstidy::gvw_important( $value );
			$important = '!important';
		}
		$values = explode( ' ', $value );

		$return = array();
		if ( count( $values ) === 4 ) {
			for ( $i = 0; $i < 4; $i++ ) {
				$return[ $shorthands[ $property ][ $i ] ] = $values[ $i ] . $important;
			}
		} elseif ( count( $values ) === 3 ) {
			$return[ $shorthands[ $property ][0] ] = $values[0] . $important;
			$return[ $shorthands[ $property ][1] ] = $values[1] . $important;
			$return[ $shorthands[ $property ][3] ] = $values[1] . $important;
			$return[ $shorthands[ $property ][2] ] = $values[2] . $important;
		} elseif ( count( $values ) === 2 ) {
			for ( $i = 0; $i < 4; $i++ ) {
				$return[ $shorthands[ $property ][ $i ] ] = ( ( $i % 2 !== 0 ) ) ? $values[1] . $important : $values[0] . $important;
			}
		} else {
			for ( $i = 0; $i < 4; $i++ ) {
				$return[ $shorthands[ $property ][ $i ] ] = $values[0] . $important;
			}
		}

		return $return;
	}

	/**
	 * Explodes a string as explode() does, however, not if $sep is escaped or within a string.
	 *
	 * @param string $sep - seperator.
	 * @param string $string - the string.
	 * @return array
	 * @version 1.0
	 */
	public static function explode_ws( $sep, $string ) {
		$status = 'st';
		$to     = '';

		$output = array();
		$num    = 0;
		for ( $i = 0, $len = strlen( $string ); $i < $len; $i++ ) {
			switch ( $status ) {
				case 'st':
					if ( $string[ $i ] === $sep && ! csstidy::escaped( $string, $i ) ) {
						++$num;
					} elseif ( $string[ $i ] === '"' || $string[ $i ] === '\'' || $string[ $i ] === '(' && ! csstidy::escaped( $string, $i ) ) {
						$status = 'str';
						$to     = ( $string[ $i ] === '(' ) ? ')' : $string[ $i ];
						( isset( $output[ $num ] ) ) ? $output[ $num ] .= $string[ $i ] : $output[ $num ] = $string[ $i ];
					} else {
						( isset( $output[ $num ] ) ) ? $output[ $num ] .= $string[ $i ] : $output[ $num ] = $string[ $i ];
					}
					break;

				case 'str':
					if ( $string[ $i ] === $to && ! csstidy::escaped( $string, $i ) ) {
						$status = 'st';
					}
					( isset( $output[ $num ] ) ) ? $output[ $num ] .= $string[ $i ] : $output[ $num ] = $string[ $i ];
					break;
			}
		}

		if ( isset( $output[0] ) ) {
			return $output;
		} else {
			return array( $output );
		}
	}

	/**
	 * Merges Shorthand properties again, the opposite of dissolve_4value_shorthands()
	 *
	 * @param array $array - the property array.
	 * @return array
	 * @version 1.2
	 * @see dissolve_4value_shorthands()
	 */
	public static function merge_4value_shorthands( $array ) {
		$return     = $array;
		$shorthands = & $GLOBALS['csstidy']['shorthands'];

		foreach ( $shorthands as $key => $value ) {
			if ( isset( $array[ $value[0] ] ) && isset( $array[ $value[1] ] )
							&& isset( $array[ $value[2] ] ) && isset( $array[ $value[3] ] ) && $value !== 0 ) {
				$return[ $key ] = '';

				$important = '';
				for ( $i = 0; $i < 4; $i++ ) {
					$val = $array[ $value[ $i ] ];
					if ( csstidy::is_important( $val ) ) {
						$important       = '!important';
						$return[ $key ] .= csstidy::gvw_important( $val ) . ' ';
					} else {
						$return[ $key ] .= $val . ' ';
					}
					unset( $return[ $value[ $i ] ] );
				}
				$return[ $key ] = self::shorthand( trim( $return[ $key ] . $important ) );
			}
		}
		return $return;
	}

	/**
	 * Dissolve background property
	 *
	 * @param string $str_value - the string value.
	 * @return array
	 * @version 1.0
	 * @see merge_bg()
	 * @todo full CSS 3 compliance
	 */
	public static function dissolve_short_bg( $str_value ) {
		$have = array();
		// don't try to explose background gradient !
		if ( stripos( $str_value, 'gradient(' ) !== false ) {
			return array( 'background' => $str_value );
		}

		$background_prop_default = & $GLOBALS['csstidy']['background_prop_default'];
		$repeat                  = array( 'repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space' );
		$attachment              = array( 'scroll', 'fixed', 'local' );
		$clip                    = array( 'border', 'padding' );
		$origin                  = array( 'border', 'padding', 'content' );
		$pos                     = array( 'top', 'center', 'bottom', 'left', 'right' );
		$important               = '';
		$return                  = array(
			'background-image'      => null,
			'background-size'       => null,
			'background-repeat'     => null,
			'background-position'   => null,
			'background-attachment' => null,
			'background-clip'       => null,
			'background-origin'     => null,
			'background-color'      => null,
		);

		if ( csstidy::is_important( $str_value ) ) {
			$important = ' !important';
			$str_value = csstidy::gvw_important( $str_value );
		}

		$str_value = self::explode_ws( ',', $str_value );
		for ( $i = 0, $l = count( $str_value ); $i < $l; $i++ ) {
			$have['clip']  = false;
			$have['pos']   = false;
			$have['color'] = false;
			$have['bg']    = false;

			if ( is_array( $str_value[ $i ] ) ) {
				$str_value[ $i ] = $str_value[ $i ][0];
			}
			$str_value[ $i ] = self::explode_ws( ' ', trim( $str_value[ $i ] ) );

			for ( $j = 0, $k = count( $str_value[ $i ] ); $j < $k; $j++ ) {
				if ( $have['bg'] === false && ( substr( $str_value[ $i ][ $j ], 0, 4 ) === 'url(' || $str_value[ $i ][ $j ] === 'none' ) ) {
					$return['background-image'] .= $str_value[ $i ][ $j ] . ',';
					$have['bg']                  = true;
				} elseif ( in_array( $str_value[ $i ][ $j ], $repeat, true ) ) {
					$return['background-repeat'] .= $str_value[ $i ][ $j ] . ',';
				} elseif ( in_array( $str_value[ $i ][ $j ], $attachment, true ) ) {
					$return['background-attachment'] .= $str_value[ $i ][ $j ] . ',';
				} elseif ( in_array( $str_value[ $i ][ $j ], $clip, true ) && ! $have['clip'] ) {
					$return['background-clip'] .= $str_value[ $i ][ $j ] . ',';
					$have['clip']               = true;
				} elseif ( in_array( $str_value[ $i ][ $j ], $origin, true ) ) {
					$return['background-origin'] .= $str_value[ $i ][ $j ] . ',';
				} elseif ( $str_value[ $i ][ $j ][0] === '(' ) {
					$return['background-size'] .= substr( $str_value[ $i ][ $j ], 1, -1 ) . ',';
				} elseif ( in_array( $str_value[ $i ][ $j ], $pos, true ) || is_numeric( $str_value[ $i ][ $j ][0] ) || $str_value[ $i ][ $j ][0] === null || $str_value[ $i ][ $j ][0] === '-' || $str_value[ $i ][ $j ][0] === '.' ) {
					$return['background-position'] .= $str_value[ $i ][ $j ];
					if ( ! $have['pos'] ) {
						$return['background-position'] .= ' ';
					} else {
						$return['background-position'] .= ',';
					}
					$have['pos'] = true;
				} elseif ( ! $have['color'] ) {
					$return['background-color'] .= $str_value[ $i ][ $j ] . ',';
					$have['color']               = true;
				}
			}
		}

		foreach ( $background_prop_default as $bg_prop => $default_value ) {
			if ( $return[ $bg_prop ] !== null ) {
				$return[ $bg_prop ] = substr( $return[ $bg_prop ], 0, -1 ) . $important;
			} else {
				$return[ $bg_prop ] = $default_value . $important;
			}
		}
		return $return;
	}

	/**
	 * Merges all background properties
	 *
	 * @param array $input_css - inputted CSS.
	 * @return array
	 * @version 1.0
	 * @see dissolve_short_bg()
	 * @todo full CSS 3 compliance
	 */
	public static function merge_bg( $input_css ) {
		$background_prop_default = & $GLOBALS['csstidy']['background_prop_default'];
		// Max number of background images. CSS3 not yet fully implemented.
		$number_of_values = @max( count( self::explode_ws( ',', $input_css['background-image'] ) ), count( self::explode_ws( ',', $input_css['background-color'] ) ), 1 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		// Array with background images to check if BG image exists.
		$bg_img_array = @self::explode_ws( ',', csstidy::gvw_important( $input_css['background-image'] ) ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		$new_bg_value = '';
		$important    = '';

		// if background properties is here and not empty, don't try anything.
		if ( isset( $input_css['background'] ) && $input_css['background'] ) {
			return $input_css;
		}

		for ( $i = 0; $i < $number_of_values; $i++ ) {
			foreach ( $background_prop_default as $bg_property => $default_value ) {
				// Skip if property does not exist
				if ( ! isset( $input_css[ $bg_property ] ) ) {
					continue;
				}

				$cur_value = $input_css[ $bg_property ];
				// skip all optimisation if gradient() somewhere.
				if ( stripos( $cur_value, 'gradient(' ) !== false ) {
					return $input_css;
				}

				// Skip some properties if there is no background image.
				if ( ( ! isset( $bg_img_array[ $i ] ) || $bg_img_array[ $i ] === 'none' )
								&& ( $bg_property === 'background-size' || $bg_property === 'background-position'
								|| $bg_property === 'background-attachment' || $bg_property === 'background-repeat' ) ) {
					continue;
				}

				// Remove !important.
				if ( csstidy::is_important( $cur_value ) ) {
					$important = ' !important';
					$cur_value = csstidy::gvw_important( $cur_value );
				}

				// Do not add default values.
				if ( $cur_value === $default_value ) {
					continue;
				}

				$temp = self::explode_ws( ',', $cur_value );

				if ( isset( $temp[ $i ] ) ) {
					if ( $bg_property === 'background-size' ) {
						$new_bg_value .= '(' . $temp[ $i ] . ') ';
					} else {
						$new_bg_value .= $temp[ $i ] . ' ';
					}
				}
			}

			$new_bg_value = trim( $new_bg_value );
			if ( $i !== $number_of_values - 1 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
				$new_bg_value .= ',';
			}
		}

		// Delete all background-properties.
		foreach ( $background_prop_default as $bg_property => $default_value ) {
			unset( $input_css[ $bg_property ] );
		}

		// Add new background property.
		if ( $new_bg_value !== '' ) {
			$input_css['background'] = $new_bg_value . $important;
		} elseif ( isset( $input_css['background'] ) ) {
			$input_css['background'] = 'none';
		}

		return $input_css;
	}

	/**
	 * Dissolve font property
	 *
	 * @param string $str_value - the string value.
	 * @return array
	 * @version 1.3
	 * @see merge_font()
	 */
	public static function dissolve_short_font( $str_value ) {
		$have              = array();
		$font_prop_default = & $GLOBALS['csstidy']['font_prop_default'];
		$font_weight       = array( 'normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900' );
		$font_variant      = array( 'normal', 'small-caps' );
		$font_style        = array( 'normal', 'italic', 'oblique' );
		$important         = '';
		$return            = array(
			'font-style'   => null,
			'font-variant' => null,
			'font-weight'  => null,
			'font-size'    => null,
			'line-height'  => null,
			'font-family'  => null,
		);

		if ( csstidy::is_important( $str_value ) ) {
			$important = '!important';
			$str_value = csstidy::gvw_important( $str_value );
		}

		$have['style']   = false;
		$have['variant'] = false;
		$have['weight']  = false;
		$have['size']    = false;
		// Detects if font-family consists of several words w/o quotes.
		$multiwords = false;

		// Workaround with multiple font-family.
		$str_value = self::explode_ws( ',', trim( $str_value ) );

		$str_value[0] = self::explode_ws( ' ', trim( $str_value[0] ) );

		for ( $j = 0, $k = count( $str_value[0] ); $j < $k; $j++ ) {
			if ( $have['weight'] === false && in_array( $str_value[0][ $j ], $font_weight, true ) ) {
				$return['font-weight'] = $str_value[0][ $j ];
				$have['weight']        = true;
			} elseif ( $have['variant'] === false && in_array( $str_value[0][ $j ], $font_variant, true ) ) {
				$return['font-variant'] = $str_value[0][ $j ];
				$have['variant']        = true;
			} elseif ( $have['style'] === false && in_array( $str_value[0][ $j ], $font_style, true ) ) {
				$return['font-style'] = $str_value[0][ $j ];
				$have['style']        = true;
			} elseif ( $have['size'] === false && ( is_numeric( $str_value[0][ $j ][0] ) || $str_value[0][ $j ][0] === null || $str_value[0][ $j ][0] === '.' ) ) {
				$size                = self::explode_ws( '/', trim( $str_value[0][ $j ] ) );
				$return['font-size'] = $size[0];
				if ( isset( $size[1] ) ) {
					$return['line-height'] = $size[1];
				} else {
					$return['line-height'] = ''; // don't add 'normal' !
				}
				$have['size'] = true;
			} else {
				if ( isset( $return['font-family'] ) ) {
					$return['font-family'] .= ' ' . $str_value[0][ $j ];
					$multiwords             = true;
				} else {
					$return['font-family'] = $str_value[0][ $j ];
				}
			}
		}
		// add quotes if we have several qords in font-family.
		if ( $multiwords !== false ) {
			$return['font-family'] = '"' . $return['font-family'] . '"';
		}
		$i = 1;
		while ( isset( $str_value[ $i ] ) ) {
			$return['font-family'] .= ',' . trim( $str_value[ $i ] );
			$i++;
		}

		// Fix for 100 and more font-size.
		if ( $have['size'] === false && isset( $return['font-weight'] ) &&
			is_numeric( $return['font-weight'][0] )
		) {
			$return['font-size'] = $return['font-weight'];
			unset( $return['font-weight'] );
		}

		foreach ( $font_prop_default as $font_prop => $default_value ) {
			if ( $return[ $font_prop ] !== null ) {
				$return[ $font_prop ] = $return[ $font_prop ] . $important;
			} else {
				$return[ $font_prop ] = $default_value . $important;
			}
		}
		return $return;
	}

	/**
	 * Merges all fonts properties
	 *
	 * @param array $input_css - input CSS.
	 * @return array
	 * @version 1.3
	 * @see dissolve_short_font()
	 */
	public static function merge_font( $input_css ) {
		$font_prop_default = & $GLOBALS['csstidy']['font_prop_default'];
		$new_font_value    = '';
		$important         = '';
		// Skip if not font-family and font-size set.
		if ( isset( $input_css['font-family'] ) && isset( $input_css['font-size'] ) ) {
			// fix several words in font-family - add quotes.
			if ( isset( $input_css['font-family'] ) ) {
				$families        = explode( ',', $input_css['font-family'] );
				$result_families = array();
				foreach ( $families as $family ) {
					$family = trim( $family );
					$len    = strlen( $family );
					if ( strpos( $family, ' ' ) &&
									! ( ( $family[0] === '"' && $family[ $len - 1 ] === '"' ) ||
									( $family[0] === "'" && $family[ $len - 1 ] === "'" ) ) ) {
						$family = '"' . $family . '"';
					}
					$result_families[] = $family;
				}
				$input_css['font-family'] = implode( ',', $result_families );
			}
			foreach ( $font_prop_default as $font_property => $default_value ) {

				// Skip if property does not exist.
				if ( ! isset( $input_css[ $font_property ] ) ) {
					continue;
				}

				$cur_value = $input_css[ $font_property ];

				// Skip if default value is used.
				if ( $cur_value === $default_value ) {
					continue;
				}

				// Remove !important.
				if ( csstidy::is_important( $cur_value ) ) {
					$important = '!important';
					$cur_value = csstidy::gvw_important( $cur_value );
				}

				$new_font_value .= $cur_value;
				// Add delimiter.
				$new_font_value .= ( $font_property === 'font-size' &&
								isset( $input_css['line-height'] ) ) ? '/' : ' ';
			}

			$new_font_value = trim( $new_font_value );

			// Delete all font-properties.
			foreach ( $font_prop_default as $font_property => $default_value ) {
				if ( $font_property !== 'font' || ! $new_font_value ) {
					unset( $input_css[ $font_property ] );
				}
			}

			// Add new font property.
			if ( $new_font_value !== '' ) {
				$input_css['font'] = $new_font_value . $important;
			}
		}

		return $input_css;
	}

}
