<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * CSSTidy - CSS Parser and Optimiser
 *
 * CSS Printing class
 * This class prints CSS data generated by csstidy.
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
 * @author Cedric Morin (cedric at yterium dot com) 2010
 */

/**
 * CSS Printing class
 *
 * This class prints CSS data generated by csstidy.
 *
 * @package csstidy
 * @author Florian Schmitz (floele at gmail dot com) 2005-2006
 * @version 1.0.1
 */
class csstidy_print { // phpcs:ignore

	/**
	 * Saves the input CSS string
	 *
	 * @var string
	 * @access private
	 */
	public $input_css = '';
	/**
	 * Saves the formatted CSS string
	 *
	 * @var string
	 * @access public
	 */
	public $output_css = '';
	/**
	 * Saves the formatted CSS string (plain text)
	 *
	 * @var string
	 * @access public
	 */
	public $output_css_plain = '';

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
		$this->template  = & $css->template;
		$this->tokens    = & $css->tokens;
		$this->charset   = & $css->charset;
		$this->import    = & $css->import;
		$this->namespace = & $css->namespace;
	}

	/**
	 * Call constructor function.
	 *
	 * @param object $css - the CSS we're working with.
	 */
	public function csstidy_print( &$css ) {
		$this->__construct( $css );
	}

	/**
	 * Resets output_css and output_css_plain (new css code)
	 *
	 * @access private
	 * @version 1.0
	 */
	public function _reset() { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$this->output_css       = '';
		$this->output_css_plain = '';
	}

	/**
	 * Returns the CSS code as plain text
	 *
	 * @param string $default_media default @media to add to selectors without any @media.
	 * @return string
	 * @access public
	 * @version 1.0
	 */
	public function plain( $default_media = '' ) {
		$this->_print( true, $default_media );
		return $this->output_css_plain;
	}

	/**
	 * Returns the formatted CSS code
	 *
	 * @param string $default_media default @media to add to selectors without any @media.
	 * @return string
	 * @access public
	 * @version 1.0
	 */
	public function formatted( $default_media = '' ) {
		$this->_print( false, $default_media );
		return $this->output_css;
	}

	/**
	 * Returns the formatted CSS code to make a complete webpage
	 *
	 * @param string $doctype shorthand for the document type.
	 * @param bool   $externalcss indicates whether styles to be attached internally or as an external stylesheet.
	 * @param string $title title to be added in the head of the document.
	 * @param string $lang two-letter language code to be added to the output.
	 * @return string
	 * @access public
	 * @version 1.4
	 */
	public function formatted_page( $doctype = 'xhtml1.1', $externalcss = true, $title = '', $lang = 'en' ) {
		switch ( $doctype ) {
			case 'xhtml1.0strict':
				$doctype_output = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
			"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';
				break;
			case 'xhtml1.1':
			default:
				$doctype_output = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
				"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
				break;
		}
		$cssparsed              = '';
		$output                 = '';
		$this->output_css_plain = & $output;

		$output .= $doctype_output . "\n" . '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="' . $lang . '"';
		$output .= ( $doctype === 'xhtml1.1' ) ? '>' : ' lang="' . $lang . '">';
		$output .= "\n<head>\n    <title>$title</title>";

		if ( $externalcss ) {
			$output   .= "\n    <style type=\"text/css\">\n";
			$cssparsed = file_get_contents( 'cssparsed.css' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$output   .= $cssparsed; // Adds an invisible BOM or something, but not in css_optimised.php
			$output   .= "\n</style>";
		} else {
			$output .= "\n" . '    <link rel="stylesheet" type="text/css" href="cssparsed.css" />'; // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet
			// }
		}
		$output .= "\n</head>\n<body><code id=\"copytext\">";
		$output .= $this->formatted();
		$output .= '</code>' . "\n" . '</body></html>';
		return $this->output_css_plain;
	}

	/**
	 * Returns the formatted CSS Code and saves it into $this->output_css and $this->output_css_plain
	 *
	 * @param bool   $plain plain text or not.
	 * @param string $default_media default @media to add to selectors without any @media.
	 * @access private
	 * @version 2.0
	 */
	public function _print( $plain = false, $default_media = '' ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore -- print is a reserved word anyway.
		if ( $this->output_css && $this->output_css_plain ) {
			return;
		}

		$output = '';
		if ( ! $this->parser->get_cfg( 'preserve_css' ) ) {
			$this->convert_raw_css( $default_media );
		}

		$template = & $this->template;

		if ( $plain ) {
			$template = array_map( 'strip_tags', $template );
		}

		if ( $this->parser->get_cfg( 'timestamp' ) ) {
			// @todo - see if we can use GM Date.
			array_unshift( $this->tokens, array( COMMENT, ' CSSTidy ' . $this->parser->version . ': ' . date( 'r' ) . ' ' ) ); // phpcs:ignore WordPress.DateTime.RestrictedFunctions.date_date
		}

		if ( ! empty( $this->charset ) ) {
			$output .= $template[0] . '@charset ' . $template[5] . $this->charset . $template[6];
		}

		if ( ! empty( $this->import ) ) {
			for ( $i = 0, $size = count( $this->import ); $i < $size; $i++ ) {
				$import_components = explode( ' ', $this->import[ $i ] );
				if ( substr( $import_components[0], 0, 4 ) === 'url(' && substr( $import_components[0], -1, 1 ) === ')' ) {
					$import_components[0] = '\'' . trim( substr( $import_components[0], 4, -1 ), "'\"" ) . '\'';
					$this->import[ $i ]   = implode( ' ', $import_components );
					$this->parser->log( 'Optimised @import : Removed "url("', 'Information' );
				}
				$output .= $template[0] . '@import ' . $template[5] . $this->import[ $i ] . $template[6];
			}
		}
		if ( ! empty( $this->namespace ) ) {
			if ( substr( $this->namespace, 0, 4 ) === 'url(' && substr( $this->namespace, -1, 1 ) === ')' ) {
				$this->namespace = '\'' . substr( $this->namespace, 4, -1 ) . '\'';
				$this->parser->log( 'Optimised @namespace : Removed "url("', 'Information' );
			}
			$output .= $template[0] . '@namespace ' . $template[5] . $this->namespace . $template[6];
		}

		$output   .= $template[13];
		$in_at_out = '';
		$out       = & $output;

		foreach ( $this->tokens as $key => $token ) {
			switch ( $token[0] ) {
				case AT_START:
					$out .= $template[0] . $this->htmlsp( $token[1], $plain ) . $template[1];
					$out  = & $in_at_out;
					break;

				case SEL_START:
					if ( $this->parser->get_cfg( 'lowercase_s' ) ) {
						$token[1] = strtolower( $token[1] );
					}
					$out .= ( $token[1][0] !== '@' ) ? $template[2] . $this->htmlsp( $token[1], $plain ) : $template[0] . $this->htmlsp( $token[1], $plain );
					$out .= $template[3];
					break;

				case PROPERTY:
					if ( $this->parser->get_cfg( 'case_properties' ) === 2 ) {
						$token[1] = strtoupper( $token[1] );
					} elseif ( $this->parser->get_cfg( 'case_properties' ) === 1 ) {
						$token[1] = strtolower( $token[1] );
					}
					$out .= $template[4] . $this->htmlsp( $token[1], $plain ) . ':' . $template[5];
					break;

				case VALUE:
					$out .= $this->htmlsp( $token[1], $plain );
					if ( $this->seeknocomment( $key, 1 ) === SEL_END && $this->parser->get_cfg( 'remove_last_;' ) ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
						$out .= str_replace( ';', '', $template[6] );
					} else {
						$out .= $template[6];
					}
					break;

				case SEL_END:
					$out .= $template[7];
					if ( $this->seeknocomment( $key, 1 ) !== AT_END ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
						$out .= $template[8];
					}
					break;

				case AT_END:
					$out       = & $output;
					$out      .= $template[10] . str_replace( "\n", "\n" . $template[10], $in_at_out );
					$in_at_out = '';
					$out      .= $template[9];
					break;

				case COMMENT:
					$out .= $template[11] . '/*' . $this->htmlsp( $token[1], $plain ) . '*/' . $template[12];
					break;
			}
		}

		$output = trim( $output );

		if ( ! $plain ) {
			$this->output_css = $output;
			$this->_print( true );
		} else {
			// If using spaces in the template, don't want these to appear in the plain output
			$this->output_css_plain = str_replace( '&#160;', '', $output );
		}
	}

	/**
	 * Gets the next token type which is $move away from $key, excluding comments
	 *
	 * @param integer $key current position.
	 * @param integer $move move this far.
	 * @return mixed a token type
	 * @access private
	 * @version 1.0
	 */
	public function seeknocomment( $key, $move ) {
		$go = ( $move > 0 ) ? 1 : -1;
		for ( $i = $key + 1; abs( $key - $i ) - 1 < abs( $move ); $i += $go ) { // phpcs:ignore Generic.CodeAnalysis.ForLoopWithTestFunctionCall.NotAllowed
			if ( ! isset( $this->tokens[ $i ] ) ) {
				return;
			}
			if ( $this->tokens[ $i ][0] === COMMENT ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
				$move += 1; // phpcs:ignore Squiz.Operators.IncrementDecrementUsage.Found
				continue;
			}
			return $this->tokens[ $i ][0];
		}
	}

	/**
	 * Converts $this->css array to a raw array ($this->tokens)
	 *
	 * @param string $default_media default @media to add to selectors without any @media.
	 * @access private
	 * @version 1.0
	 */
	public function convert_raw_css( $default_media = '' ) {
		$this->tokens = array();

		foreach ( $this->css as $medium => $val ) {
			if ( $this->parser->get_cfg( 'sort_selectors' ) ) {
				ksort( $val );
			}
			if ( (int) $medium < DEFAULT_AT ) {
				$this->parser->_add_token( AT_START, $medium, true );
			} elseif ( $default_media ) {
				$this->parser->_add_token( AT_START, $default_media, true );
			}

			foreach ( $val as $selector => $vali ) {
				if ( $this->parser->get_cfg( 'sort_properties' ) ) {
					ksort( $vali );
				}
				$this->parser->_add_token( SEL_START, $selector, true );

				foreach ( $vali as $property => $valj ) {
					$this->parser->_add_token( PROPERTY, $property, true );
					$this->parser->_add_token( VALUE, $valj, true );
				}

				$this->parser->_add_token( SEL_END, $selector, true );
			}

			if ( (int) $medium < DEFAULT_AT ) {
				$this->parser->_add_token( AT_END, $medium, true );
			} elseif ( $default_media ) {
				$this->parser->_add_token( AT_END, $default_media, true );
			}
		}
	}

	/**
	 * Same as htmlspecialchars, only that chars are not replaced if $plain !== true. This makes  print_code() cleaner.
	 *
	 * @param string $string - the string we're converting.
	 * @param bool   $plain - plain text or not.
	 * @return string
	 * @see csstidy_print::_print()
	 * @access private
	 * @version 1.0
	 */
	public function htmlsp( $string, $plain ) {
		if ( ! $plain ) {
			return htmlspecialchars( $string, ENT_QUOTES, 'utf-8' );
		}
		return $string;
	}

	/**
	 * Get compression ratio
	 *
	 * @access public
	 * @return float
	 * @version 1.2
	 */
	public function get_ratio() {
		if ( ! $this->output_css_plain ) {
			$this->formatted();
		}
		return round( ( strlen( $this->input_css ) - strlen( $this->output_css_plain ) ) / strlen( $this->input_css ), 3 ) * 100;
	}

	/**
	 * Get difference between the old and new code in bytes and prints the code if necessary.
	 *
	 * @access public
	 * @return string
	 * @version 1.1
	 */
	public function get_diff() {
		if ( ! $this->output_css_plain ) {
			$this->formatted();
		}

		$diff = strlen( $this->output_css_plain ) - strlen( $this->input_css );

		if ( $diff > 0 ) {
			return '+' . $diff;
		} elseif ( $diff === 0 ) {
			return '+-' . $diff;
		}

		return $diff;
	}

	/**
	 * Get the size of either input or output CSS in KB
	 *
	 * @param string $loc default is "output".
	 * @access public
	 * @return integer
	 * @version 1.0
	 */
	public function size( $loc = 'output' ) {
		if ( $loc === 'output' && ! $this->output_css ) {
			$this->formatted();
		}

		if ( $loc === 'input' ) {
			return ( strlen( $this->input_css ) / 1000 );
		} else {
			return ( strlen( $this->output_css_plain ) / 1000 );
		}
	}

}
