<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * XMLWriter implementation of the sitemap buffer.
 *
 * @since 14.6
 * @package automattic/jetpack
 */

/**
 * A buffer for constructing sitemap xml files using XMLWriter.
 *
 * @since 14.6
 */
abstract class Jetpack_Sitemap_Buffer_XMLWriter {

	/**
	 * Largest number of items the buffer can hold.
	 *
	 * @access protected
	 * @since 14.6
	 * @var int $item_capacity The item capacity.
	 */
	protected $item_capacity;

	/**
	 * Largest number of bytes the buffer can hold.
	 *
	 * @access protected
	 * @since 14.6
	 * @var int $byte_capacity The byte capacity.
	 */
	protected $byte_capacity;

	/**
	 * Flag which detects when the buffer is full.
	 *
	 * @access protected
	 * @since 14.6
	 * @var bool $is_full_flag The flag value.
	 */
	protected $is_full_flag;

	/**
	 * The most recent timestamp seen by the buffer.
	 *
	 * @access protected
	 * @since 14.6
	 * @var string $timestamp Must be in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	protected $timestamp;

	/**
	 * The XMLWriter instance used to construct the XML.
	 *
	 * @access protected
	 * @since 14.6
	 * @var XMLWriter $writer
	 */
	protected $writer;

	/**
	 * Helper class to construct sitemap paths.
	 *
	 * @since 14.6
	 * @protected
	 * @var Jetpack_Sitemap_Finder
	 */
	protected $finder;

	/**
	 * The XML content as a string.
	 *
	 * @access protected
	 * @since 14.6
	 * @var string $content
	 */
	protected $content = '';

	/**
	 * Construct a new Jetpack_Sitemap_Buffer_XMLWriter.
	 *
	 * @since 14.6
	 *
	 * @param int    $item_limit The maximum size of the buffer in items.
	 * @param int    $byte_limit The maximum size of the buffer in bytes.
	 * @param string $time The initial datetime of the buffer. Must be in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function __construct( $item_limit, $byte_limit, $time ) {
		$this->is_full_flag = false;
		$this->timestamp    = $time;
		$this->finder       = new Jetpack_Sitemap_Finder();

		$this->writer = new XMLWriter();
		$this->writer->openMemory();
		$this->writer->setIndent( true );
		$this->writer->startDocument( '1.0', 'UTF-8' );

		$this->item_capacity = max( 1, (int) $item_limit );
		$this->byte_capacity = max( 1, (int) $byte_limit );

		$this->initialize_buffer();
	}

	/**
	 * Initialize the buffer with any required headers or setup.
	 * This should be implemented by child classes.
	 *
	 * @access protected
	 * @since 14.6
	 */
	abstract protected function initialize_buffer();

	/**
	 * Append an item to the buffer.
	 *
	 * @since 14.6
	 *
	 * @param array $array The item to be added.
	 * @return bool True if the append succeeded, False if not.
	 */
	public function append( $array ) {
		if ( $array === null ) {
			return true;
		}

		if ( $this->is_full_flag ) {
			return false;
		}

		if ( 0 >= $this->item_capacity || 0 >= $this->byte_capacity ) {
			$this->is_full_flag = true;
			return false;
		}

		$current_content = $this->writer->outputMemory( true );
		$this->content  .= $current_content;

		$this->append_item( $array );

		$new_content    = $this->writer->outputMemory( true );
		$this->content .= $new_content;

		// Update capacities after successful append
		$this->item_capacity -= 1;
		$this->byte_capacity -= strlen( $new_content );

		// Check both capacity limits
		if ( 0 >= $this->item_capacity || $this->byte_capacity <= 0 ) {
			$this->is_full_flag = true;
		}

		return true;
	}

	/**
	 * Append a specific item to the buffer.
	 * This should be implemented by child classes.
	 *
	 * @access protected
	 * @since 14.6
	 * @param array $array The item to be added.
	 */
	abstract protected function append_item( $array );

	/**
	 * Retrieve the contents of the buffer.
	 *
	 * @since 14.6
	 * @return string The contents of the buffer.
	 */
	public function contents() {
		$this->writer->endElement(); // End root element (urlset/sitemapindex)
		$this->writer->endDocument();
		$final_content  = $this->writer->outputMemory( true );
		$this->content .= $final_content;

		if ( empty( $this->content ) ) {
			// If buffer is empty, return a minimal valid XML structure
			return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>";
		}
		return $this->content;
	}

	/**
	 * Detect whether the buffer is full.
	 *
	 * @since 14.6
	 * @return bool True if the buffer is full, false otherwise.
	 */
	public function is_full() {
		return $this->is_full_flag;
	}

	/**
	 * Detect whether the buffer is empty.
	 *
	 * @since 14.6
	 * @return bool True if the buffer is empty, false otherwise.
	 */
	public function is_empty() {
		$current        = $this->writer->outputMemory( true );
		$this->content .= $current;
		return empty( $this->content );
	}

	/**
	 * Update the timestamp of the buffer.
	 *
	 * @since 14.6
	 * @param string $new_time A datetime string in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function view_time( $new_time ) {
		$this->timestamp = max( $this->timestamp, $new_time );
	}

	/**
	 * Retrieve the timestamp of the buffer.
	 *
	 * @since 14.6
	 * @return string A datetime string in 'YYYY-MM-DD hh:mm:ss' format.
	 */
	public function last_modified() {
		return $this->timestamp;
	}

	/**
	 * Compatibility method for the old DOMDocument implementation.
	 * This is only here to satisfy the jetpack_print_sitemap filter.
	 *
	 * @since 14.6
	 * @return null
	 */
	public function get_document() {
		return null;
	}
}
