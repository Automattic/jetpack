<?php

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
 * Sitemaps (per the protocol) are essentially lists of XML fragments;
 * lists which are subject to size constraints. This class abstracts
 * the details of checking these constraints.
 */
class Jetpack_Sitemap_Buffer {
	private $item_capacity;
	private $byte_capacity;
	private $footer_text;
	private $buffer;
	private $is_full_flag;  // True if we've tried to add something and failed.
	private $timestamp;     // 'YYYY-MM-DD hh:mm:ss'

	/**
	 * Construct a new Jetpack_Sitemap_Buffer.
	 *
	 * @param int $item_limit The maximum size of the buffer in items.
	 * @param int $byte_limit The maximum size of the buffer in bytes.
	 * @param string $header The string to prepend to the entire buffer.
	 * @param string $footer The string to append to the entire buffer.
	 * @param string $time The initial timestamp of the buffer, in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function __construct(
		$item_limit = 50000,    // 50k
		$byte_limit = 10485760, // 10MB
		$header = '',
		$footer = '',
		$time
	) {
		$this->item_capacity = $item_limit;
		$this->byte_capacity = $byte_limit - mb_strlen($header) - mb_strlen($footer);
		$this->footer_text = $footer;
		$this->buffer = $header;
		$this->is_full_flag = false;
		$this->timestamp = $time;
		return;
	}

	/**
	 * Append an item to the buffer, if there is room for it.
	 * If not, we set is_full_flag to true.
	 *
	 * @since 4.5.0
	 *
	 * @param string $item The item to be added.
	 *
	 * @return bool True if the append succeeded, False if not.
	 */
	public function try_to_add_item($item) {
		if ($this->item_capacity <= 0 || $this->byte_capacity - mb_strlen($item) <= 0) {
			$this->is_full_flag = true;
			return false;
		} else {
			$this->item_capacity -= 1;
			$this->byte_capacity -= mb_strlen($item);
			$this->buffer .= $item;
			return true;
		}
	}

	/**
	 * Retrieve the contents of the buffer.
	 *
	 * @since 4.5.0
	 *
	 * @return string The contents of the buffer (with the footer included).
	 */
	public function contents() {
		return $this->buffer . $this->footer_text;
	}

	/**
	 * Detect whether the buffer is full.
	 *
	 * @since 4.5.0
	 *
	 * @return bool True if the buffer is full, false otherwise.
	 */
	public function is_full() {
		return $this->is_full_flag;
	}

	/**
	 * Update the timestamp of the buffer.
	 *
	 * @since 4.5.0
	 *
	 * @param string $new_time A datetime string in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function view_time($new_time) {
		if ( strtotime($this->timestamp) < strtotime($new_time) ) {
			$this->timestamp = $new_time;
		}
		return;
	}

	/**
	 * Retrieve the timestamp of the buffer.
	 *
	 * @since 4.5.0
	 *
	 * @return string A datetime string in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function last_modified() {
		return $this->timestamp;
	}
}
