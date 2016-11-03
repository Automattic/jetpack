<?php
/**
 * Sitemaps (per the protocol) are essentially lists of XML fragments;
 * lists which are subject to size constraints. This class abstracts
 * the details of checking these constraints.
 *
 * This file defines the Jetpack_Sitemap_Buffer class, which provides
 * an API for building and filling sitemaps.
 *
 * @since 4.6.0
 * @package Jetpack
 */

/**
 * A buffer for constructing sitemap xml files.
 *
 * Models a list of strings such that
 *
 * 1. the list must have a bounded number of entries,
 * 2. the concatenation of the strings must have bounded
 *      length (including some header and footer strings), and
 * 3. each item has a timestamp, and we need to keep track
 *      of the latest timestamp of the items in the list.
 *
 * @since 4.6.0
 */
class Jetpack_Sitemap_Buffer {

	/**
	 * Maximum size (in bytes) of a sitemap xml file.
	 * Per the spec, max value is 10485760 (10MB).
	 *
	 * @link http://www.sitemaps.org/
	 * @since 4.6.0
	 */
	const SITEMAP_MAX_BYTES = 10485760;

	/**
	 * Maximum size (in url nodes) of a sitemap xml file.
	 * Per the spec, max value is 50000.
	 *
	 * @link http://www.sitemaps.org/
	 * @since 4.6.0
	 */
	const SITEMAP_MAX_ITEMS = 50000;

	/**
	 * Maximum size (in url nodes) of a news sitemap xml file.
	 * Per the spec, max value is 1000.
	 *
	 * @link https://support.google.com/news/publisher/answer/74288?hl=en
	 * @since 4.6.0
	 */
	const NEWS_SITEMAP_MAX_ITEMS = 1000;

	/**
	 * Largest number of items the buffer can hold.
	 *
	 * @access private
	 * @since 4.6.0
	 * @var int $item_capacity The item capacity.
	 */
	private $item_capacity;

	/**
	 * Largest number of bytes the buffer can hold.
	 *
	 * @access private
	 * @since 4.6.0
	 * @var int $byte_capacity The byte capacity.
	 */
	private $byte_capacity;

	/**
	 * Footer text of the buffer; stored here so it can be appended when the buffer is full.
	 *
	 * @access private
	 * @since 4.6.0
	 * @var string $footer_text The footer text.
	 */
	private $footer_text;

	/**
	 * The buffer contents.
	 *
	 * @access private
	 * @since 4.6.0
	 * @var string The buffer contents.
	 */
	private $buffer;

	/**
	 * Flag which detects when the buffer is full.
	 *
	 * @access private
	 * @since 4.6.0
	 * @var bool $is_full_flag The flag value. This flag is set to false on construction and only flipped to true if we've tried to add something and failed.
	 */
	private $is_full_flag;

	/**
	 * Flag which detects when the buffer is empty.
	 *
	 * @access private
	 * @since 4.6.0
	 * @var bool $is_empty_flag The flag value. This flag is set to true on construction and only flipped to false if we've tried to add something and succeeded.
	 */
	private $is_empty_flag;

	/**
	 * The most recent timestamp seen by the buffer.
	 *
	 * @access private
	 * @since 4.6.0
	 * @var string $timestamp Must be in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	private $timestamp;

	/**
	 * Construct a new Jetpack_Sitemap_Buffer.
	 *
	 * @since 4.6.0
	 *
	 * @param int    $item_limit The maximum size of the buffer in items. Default is 50000.
	 * @param int    $byte_limit The maximum size of the buffer in bytes. Default is 10485760 (10MB).
	 * @param string $header The string to prepend to the entire buffer.
	 * @param string $footer The string to append to the entire buffer.
	 * @param string $time The initial timestamp of the buffer. Must be in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function __construct(
		$item_limit = 50000,
		$byte_limit = 10485760,
		$header = '',
		$footer = '',
		$time
	) {
		$this->item_capacity = max( 1, intval( $item_limit ) );

		mbstring_binary_safe_encoding(); // So we can safely use mb_strlen().
		$this->byte_capacity = $byte_limit - mb_strlen( $header ) - mb_strlen( $footer );
		reset_mbstring_encoding();

		$this->footer_text = $footer;
		$this->buffer = $header;
		$this->is_full_flag = false;
		$this->is_empty_flag = true;
		$this->timestamp = $time;
		return;
	}

	/**
	 * Append an item to the buffer, if there is room for it.
	 * If not, we set is_full_flag to true. If $item is null,
	 * don't do anything and report success.
	 *
	 * @since 4.6.0
	 *
	 * @param string $item The item to be added.
	 *
	 * @return bool True if the append succeeded, False if not.
	 */
	public function try_to_add_item( $item ) {
		if ( is_null( $item ) ) {
			return true;
		} else {
			mbstring_binary_safe_encoding(); // So we can safely use mb_strlen().

			if ( 0 >= $this->item_capacity || 0 > $this->byte_capacity - mb_strlen( $item ) ) {
				$this->is_full_flag = true;
				reset_mbstring_encoding();
				return false;
			} else {
				$this->is_empty_flag = false;
				$this->item_capacity -= 1;
				$this->byte_capacity -= mb_strlen( $item );
				$this->buffer .= $item;
				reset_mbstring_encoding();
				return true;
			}
		}
	}

	/**
	 * Retrieve the contents of the buffer.
	 *
	 * @since 4.6.0
	 *
	 * @return string The contents of the buffer (with the footer included).
	 */
	public function contents() {
		return $this->buffer . $this->footer_text;
	}

	/**
	 * Detect whether the buffer is full.
	 *
	 * @since 4.6.0
	 *
	 * @return bool True if the buffer is full, false otherwise.
	 */
	public function is_full() {
		return $this->is_full_flag;
	}

	/**
	 * Detect whether the buffer is empty.
	 *
	 * @since 4.6.0
	 *
	 * @return bool True if the buffer is empty, false otherwise.
	 */
	public function is_empty() {
		return $this->is_empty_flag;
	}

	/**
	 * Update the timestamp of the buffer.
	 *
	 * @since 4.6.0
	 *
	 * @param string $new_time A datetime string in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function view_time( $new_time ) {
		$this->timestamp = max( $this->timestamp, $new_time );
		return;
	}

	/**
	 * Retrieve the timestamp of the buffer.
	 *
	 * @since 4.6.0
	 *
	 * @return string A datetime string in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function last_modified() {
		return $this->timestamp;
	}

	/**
	 * Render an associative array as an XML string. Handles attributes.
	 * This is needed because SimpleXMLElement only handles valid XML, but we want
	 * to pass around (possibly invalid) fragments.
	 *
	 * Example:
	 *
	 * array(
	 *   'html xmlns="foo"' => array(        |<html xmlns="foo">
	 *     'head' => array(                  |  <head>
	 *       'title' => 'Woo!',              |    <title>Woo!</title>
	 *     ),                                |  </head>
	 *     'body' => array(             ==>  |  <body>
	 *       'h2' => 'Some thing',           |    <h2>Some thing</h2>
	 *       'p'  => 'it's all up ons',      |    <p>it's all up ons</p>
	 *       'br' => null,                   |    <br />
	 *     ),                                |  </body>
	 *   ),                                  |</html>
	 * )
	 *
	 * @access public
	 * @since 3.9.0
	 * @since 4.6.0 Rename, add $depth parameter, change return type, handle attributes.
	 *
	 * @param array  $array A recursive associative array of tag/child relationships.
	 * @param string $depth String to prepend to each line. For internal use only.
	 *
	 * @return string The rendered XML string.
	 */
	public static function array_to_xml_string( $array, $depth = '' ) {
		$string = '';

		foreach ( $array as $key => $value ) {

			// Remove attribute from key.
			preg_match( '/^[^ ]+/', $key, $match );

			$open_tag  = esc_html( $key );
			$close_tag = esc_html( $match[0] );

			if ( is_array( $value ) ) {
				$string .= $depth . "<$open_tag>\n";
				$string .= self::array_to_xml_string( $value, $depth . '  ' );
				$string .= $depth . "</$close_tag>\n";
			} elseif ( is_null( $value ) ) {
				$string .= $depth . "<$open_tag />\n";
			} else {
				$string .= $depth . "<$open_tag>" . esc_html( $value ) . "</$close_tag>\n";
			}
		}

		return $string;
	}

	/**
	 * Render an associative array of XML attribute key/value pairs.
	 *
	 * @access public
	 * @since 4.6.0
	 *
	 * @param array  $array Key/value array of attributes.
	 * @param string $sep An optional prefix string to prepend to each attribute.
	 *
	 * @return string The rendered attribute string.
	 */
	public static function array_to_xml_attr_string( $array, $sep = '' ) {
		$string = '';

		foreach ( $array as $key => $value ) {
			$string .= $sep . ' ' . esc_html( $key ) . '="' . esc_attr( $value ) . '"';
		}

		return $string;
	}

}
