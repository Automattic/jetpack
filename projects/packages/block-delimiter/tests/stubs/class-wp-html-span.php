<?php
/**
 * WordPress HTML API Stub - WP_HTML_Span
 *
 * @package automattic/block-delimiter
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedClassFound

/**
 * Represents a span of text in HTML source.
 *
 * @since 6.2.0
 */
class WP_HTML_Span {
	/**
	 * Byte offset into source text where span begins.
	 *
	 * @since 6.2.0
	 *
	 * @var int
	 */
	public $start;

	/**
	 * Byte length of span.
	 *
	 * @since 6.5.0
	 *
	 * @var int
	 */
	public $length;

	/**
	 * Constructor.
	 *
	 * @param int $start  Byte offset into source text where span begins.
	 * @param int $length Byte length of span.
	 */
	public function __construct( int $start, int $length ) {
		$this->start  = $start;
		$this->length = $length;
	}
}
