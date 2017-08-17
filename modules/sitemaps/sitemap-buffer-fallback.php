<?php
/**
 * The fallback buffer for users with no XML support.
 *
 * @since 5.3.0
 * @package Jetpack
 */

/**
 * A buffer for constructing master sitemap xml files.
 *
 * @since 5.1.0
 */
abstract class Jetpack_Sitemap_Buffer_Fallback extends Jetpack_Sitemap_Buffer {

	/**
	 * The buffer contents.
	 *
	 * @access protected
	 * @since 5.3.0
	 * @var string The buffer contents.
	 */
	protected $buffer;

	public function __construct( $item_limit, $byte_limit, $time = '1970-01-01 00:00:00' ) {
		$this->is_full_flag = false;
		$this->is_empty_flag = true;
		$this->timestamp = $time;

		$this->finder = new Jetpack_Sitemap_Finder();

		$this->item_capacity = max( 1, intval( $item_limit ) );
		$this->byte_capacity = max( 1, intval( $byte_limit ) ) - strlen( $this->contents() );
	}

	/**
	 * Append an item to the buffer, if there is room for it,
	 * and set is_empty_flag to false. If there is no room,
	 * we set is_full_flag to true. If $item is null,
	 * don't do anything and report success.
	 *
	 * @since 5.3.0
	 *
	 * @param array $array The item to be added.
	 *
	 * @return bool True if the append succeeded, False if not.
	 */
	public function append( $array ) {
		if ( is_null( $array ) ) {
			return true;
		}

		if ( $this->is_full_flag ) {
			return false;
		}

		if ( 0 >= $this->item_capacity || 0 >= $this->byte_capacity ) {
			$this->is_full_flag = true;
			return false;
		} else {
			$this->item_capacity -= 1;
			$added_string = $this->array_to_xml_string( $array );
			$this->buffer .= $added_string;
			$this->is_empty_flag = false;

			mbstring_binary_safe_encoding(); // So we can safely use strlen().
			$this->byte_capacity -= strlen( $added_string );
			reset_mbstring_encoding();

			return true;
		}
	}

	/**
	 * Detect whether the buffer is empty.
	 *
	 * @since 5.3.0
	 *
	 * @return bool True if the buffer is empty, false otherwise.
	 */
	public function is_empty() {
		return $this->is_empty_flag;
	}

	/**
	 * Retrieve the contents of the buffer.
	 *
	 * @since 5.3.0
	 *
	 * @return string The contents of the buffer (with the footer included).
	 */
	public function contents() {
		$root = $this->get_root_element();

		return '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL . $root[0] . $this->buffer . $root[1] . PHP_EOL;
	}

	/**
	 * Legacy implementation of array to XML conversion without using DOMDocument.
	 *
	 * @param Array $array
	 * @return String $result
	 */
	public function array_to_xml_string( $array, $parent = null, $root = null ) {
		$string = '';

		foreach ( $array as $key => $value ) {
			// Only allow a-z, A-Z, colon, underscore, and hyphen.
			$tag = preg_replace( '/[^a-zA-Z:_-]/', '_', $key );

			if ( is_array( $value ) ) {
				$string .= "<$tag>";
				$string .= $this->array_to_xml_string( $value );
				$string .= "</$tag>";
			} elseif ( is_null( $value ) ) {
				$string .= "<$tag />";
			} else {
				$string .= "<$tag>" . htmlspecialchars( $value ) . "</$tag>";
			}
		}

		return $string;
	}

	/**
	 * Render an associative array of XML attribute key/value pairs.
	 *
	 * @access public
	 * @since 5.3.0
	 *
	 * @param array $array Key/value array of attributes.
	 *
	 * @return string The rendered attribute string.
	 */
	public static function array_to_xml_attr_string( $array ) {
		$string = '';

		foreach ( $array as $key => $value ) {
			$key = preg_replace( '/[^a-zA-Z:_-]/', '_', $key );
			$string .= ' ' . $key . '="' . esc_attr( $value ) . '"';
		}

		return $string;
	}

}
