<?php
/**
 * Sitemaps (per the protocol) are essentially lists of XML fragments;
 * lists which are subject to size constraints. The Jetpack_Sitemap_Buffer
 * class abstracts the details of constructing these lists while
 * maintaining the constraints.
 *
 * @since 4.8.0
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
 *      of the most recent timestamp of the items in the list.
 *
 * @since 4.8.0
 */
class Jetpack_Sitemap_Buffer {

	/**
	 * Largest number of items the buffer can hold.
	 *
	 * @access private
	 * @since 4.8.0
	 * @var int $item_capacity The item capacity.
	 */
	private $item_capacity;

	/**
	 * Largest number of bytes the buffer can hold.
	 *
	 * @access private
	 * @since 4.8.0
	 * @var int $byte_capacity The byte capacity.
	 */
	private $byte_capacity;

	/**
	 * Footer text of the buffer; stored here so it can be appended when the buffer is full.
	 *
	 * @access private
	 * @since 4.8.0
	 * @var string $footer_text The footer text.
	 */
	private $footer_text;

	/**
	 * The buffer contents.
	 *
	 * @access private
	 * @since 4.8.0
	 * @var string The buffer contents.
	 */
	private $buffer;

	/**
	 * Flag which detects when the buffer is full.
	 *
	 * @access private
	 * @since 4.8.0
	 * @var bool $is_full_flag The flag value. This flag is set to false on construction and only flipped to true if we've tried to add something and failed.
	 */
	private $is_full_flag;

	/**
	 * Flag which detects when the buffer is empty.
	 *
	 * @access private
	 * @since 4.8.0
	 * @var bool $is_empty_flag The flag value. This flag is set to true on construction and only flipped to false if we've tried to add something and succeeded.
	 */
	private $is_empty_flag;

	/**
	 * The most recent timestamp seen by the buffer.
	 *
	 * @access private
	 * @since 4.8.0
	 * @var string $timestamp Must be in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	private $timestamp;

	/**
	 * Construct a new Jetpack_Sitemap_Buffer.
	 *
	 * @since 4.8.0
	 *
	 * @param int    $item_limit The maximum size of the buffer in items.
	 * @param int    $byte_limit The maximum size of the buffer in bytes.
	 * @param string $header The string to prepend to the entire buffer.
	 * @param string $footer The string to append to the entire buffer.
	 * @param string $time The initial datetime of the buffer. Must be in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function __construct(
		$item_limit,
		$byte_limit,
		$header = '',
		$footer = '',
		$time
	) {
		$this->item_capacity = max( 1, intval( $item_limit ) );

		mbstring_binary_safe_encoding(); // So we can safely use strlen().
		$this->byte_capacity = max( 1, intval( $byte_limit ) ) - strlen( $header ) - strlen( $footer );
		reset_mbstring_encoding();

		$this->footer_text = $footer;
		$this->buffer = $header;
		$this->is_full_flag = false;
		$this->is_empty_flag = true;
		$this->timestamp = $time;
		return;
	}

	/**
	 * Append an item to the buffer, if there is room for it,
	 * and set is_empty_flag to false. If there is no room,
	 * we set is_full_flag to true. If $item is null,
	 * don't do anything and report success.
	 *
	 * @since 4.8.0
	 *
	 * @param string $item The item to be added.
	 *
	 * @return bool True if the append succeeded, False if not.
	 */
	public function try_to_add_item( $item ) {
		if ( is_null( $item ) ) {
			return true;
		} else {

			mbstring_binary_safe_encoding(); // So we can safely use strlen().
			$item_size = strlen( $item ); // Size in bytes.
			reset_mbstring_encoding();

			if ( 0 >= $this->item_capacity || 0 > $this->byte_capacity - $item_size ) {
				$this->is_full_flag = true;
				return false;
			} else {
				$this->is_empty_flag = false;
				$this->item_capacity -= 1;
				$this->byte_capacity -= $item_size;
				$this->buffer .= $item;
				return true;
			}
		}
	}

	/**
	 * Retrieve the contents of the buffer.
	 *
	 * @since 4.8.0
	 *
	 * @return string The contents of the buffer (with the footer included).
	 */
	public function contents() {
		return $this->buffer . $this->footer_text;
	}

	/**
	 * Detect whether the buffer is full.
	 *
	 * @since 4.8.0
	 *
	 * @return bool True if the buffer is full, false otherwise.
	 */
	public function is_full() {
		return $this->is_full_flag;
	}

	/**
	 * Detect whether the buffer is empty.
	 *
	 * @since 4.8.0
	 *
	 * @return bool True if the buffer is empty, false otherwise.
	 */
	public function is_empty() {
		return $this->is_empty_flag;
	}

	/**
	 * Update the timestamp of the buffer.
	 *
	 * @since 4.8.0
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
	 * @since 4.8.0
	 *
	 * @return string A datetime string in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function last_modified() {
		return $this->timestamp;
	}

	/**
	 * Render an associative array as an XML string. This is needed because
	 * SimpleXMLElement only handles valid XML, but we sometimes want to
	 * pass around (possibly invalid) fragments. Note that 'null' values make
	 * a tag self-closing; this is only sometimes correct (depending on the
	 * version of HTML/XML); see the list of 'void tags'.
	 *
	 * Example:
	 *
	 * array(
	 *   'html' => array(                    |<html xmlns="foo">
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
	 * @since 4.8.0 Rename, add $depth parameter, and change return type.
	 *
	 * @param array  $array A recursive associative array of tag/child relationships.
	 * @param string $depth String to prepend to each line. For internal use only.
	 *
	 * @return string The rendered XML string.
	 */
	public static function array_to_xml_string( $array, $depth = '' ) {
		$string = '';

		foreach ( $array as $key => $value ) {

			// Only allow a-z, A-Z, colon, underscore, and hyphen.
			$tag = preg_replace( '/[^a-zA-Z:_-]/', '_', $key );

			if ( is_array( $value ) ) {
				$string .= $depth . "<$tag>\n";
				$string .= self::array_to_xml_string( $value, $depth . '  ' );
				$string .= $depth . "</$tag>\n";
			} elseif ( is_null( $value ) ) {
				$string .= $depth . "<$tag />\n";
			} else {
				$string .= $depth . "<$tag>" . ent2ncr( $value ) . "</$tag>\n";
			}
		}

		return $string;
	}

	/**
	 * Render an associative array of XML attribute key/value pairs.
	 *
	 * @access public
	 * @since 4.8.0
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
