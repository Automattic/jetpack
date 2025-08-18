<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * XMLWriter implementation of the sitemap buffer.
 *
 * @since 14.6
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

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
	 * Flag which detects when the buffer is empty.
	 * Set true on construction and flipped to false only after a successful append.
	 *
	 * @since 15.0
	 * @var bool
	 */
	protected $is_empty_flag = true;

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
	 * The XML content chunks collected from XMLWriter.
	 *
	 * Collect chunks and join once at the end to reduce string reallocations
	 * and improve performance on large sitemaps.
	 *
	 * @access protected
	 * @since 15.0
	 * @var array $chunks
	 */
	protected $chunks = array();

	/**
	 * Tracks whether the root element has been started.
	 *
	 * @since 15.0
	 * @var bool
	 */
	protected $root_started = false;

	/**
	 * Mirror DOMDocument built on-demand for jetpack_print_sitemap compatibility.
	 *
	 * @since 15.0
	 * @var DOMDocument|null
	 */
	protected $dom_document = null;

	/**
	 * Tracks whether XMLWriter document has been finalized (closed and flushed).
	 *
	 * @since 15.0
	 * @var bool
	 */
	protected $is_finalized = false;

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
		$this->is_full_flag  = false;
		$this->is_empty_flag = true;
		$this->timestamp     = $time;
		$this->finder        = new Jetpack_Sitemap_Finder();

		$this->writer = new XMLWriter();
		$this->writer->openMemory();
		$this->writer->setIndent( true );
		$this->writer->startDocument( '1.0', 'UTF-8' );

		$this->item_capacity = max( 1, (int) $item_limit );
		$this->byte_capacity = max( 1, (int) $byte_limit );

		// Capture and account the XML declaration bytes to mirror DOM behavior.
		$declaration          = $this->writer->outputMemory( true );
		$this->chunks[]       = $declaration;
		$this->byte_capacity -= strlen( $declaration );

		// Allow subclasses to write comments and processing instructions only.
		$this->initialize_buffer();

		// Capture pre-root bytes (comments/PI). Do not subtract from capacity.
		$pre_root_output = $this->writer->outputMemory( true );
		$this->chunks[]  = $pre_root_output;
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
	 * Start the root element (e.g., urlset or sitemapindex) and write its attributes.
	 * Implemented by subclasses.
	 *
	 * @since 15.0
	 * @access protected
	 * @return void
	 */
	abstract protected function start_root();

	/**
	 * Ensure the root element has been started and account its bytes once.
	 *
	 * @since 15.0
	 * @access protected
	 * @return void
	 */
	protected function ensure_root_started() {
		if ( $this->root_started ) {
			return;
		}
		$this->start_root();
		$root_chunk           = $this->writer->outputMemory( true );
		$this->chunks[]       = $root_chunk;
		$this->byte_capacity -= strlen( $root_chunk );
		$this->root_started   = true;
	}

	/**
	 * Finalize writer output once by closing the root and document and flushing.
	 *
	 * @since 15.0
	 * @access protected
	 * @return void
	 */
	protected function finalize_writer_output() {
		if ( $this->is_finalized ) {
			return;
		}
		$this->ensure_root_started();
		$this->writer->endElement(); // End root element (urlset/sitemapindex)
		$this->writer->endDocument();
		$final_content      = $this->writer->outputMemory( true );
		$this->chunks[]     = $final_content;
		$this->is_finalized = true;
	}

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

		// Ensure root is started on first append and account its bytes.
		$this->ensure_root_started();

		// Attempt to render the item. Subclasses may decide to skip writing
		// if the input structure is invalid for that sitemap type.
		$this->append_item( $array );

		// Capture only the bytes produced by this item.
		$new_content = $this->writer->outputMemory( true );

		// If nothing was written, treat as a no-op: keep the buffer "empty"
		// and do not consume item/byte capacities.
		if ( '' === $new_content ) {
			return true;
		}

		// Persist newly written bytes and update capacities.
		$this->chunks[]       = $new_content;
		$this->item_capacity -= 1;
		$this->byte_capacity -= strlen( $new_content );
		$this->is_empty_flag  = false;

		// Check both capacity limits.
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
	 * Recursively writes XML elements from an associative array.
	 *
	 * This method iterates through an array and writes XML elements using the XMLWriter instance.
	 * If a value in the array is itself an array, it calls itself recursively.
	 *
	 * @access protected
	 * @since 15.0
	 *
	 * @param array $data The array to convert to XML.
	 */
	protected function array_to_xml( $data ) {
		foreach ( (array) $data as $tag => $value ) {
			if ( is_array( $value ) ) {
				$this->writer->startElement( $tag );
				$this->array_to_xml( $value );
				$this->writer->endElement();
			} else {
				// Write raw text; XMLWriter will escape XML-reserved chars, matching DOMDocument behavior.
				$this->writer->writeElement( $tag, (string) $value );
			}
		}
	}

	/**
	 * Retrieve the contents of the buffer.
	 *
	 * @since 14.6
	 * @return string The contents of the buffer.
	 */
	public function contents() {
		$this->finalize_writer_output();
		if ( $this->dom_document instanceof DOMDocument ) {
			return $this->dom_document->saveXML();
		}
		if ( empty( $this->chunks ) ) {
			// If buffer is empty, return a minimal valid XML structure
			return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>";
		}
		return implode( '', $this->chunks );
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
		return $this->is_empty_flag;
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
	 * @return DOMDocument DOM representation of the current sitemap contents.
	 */
	public function get_document() {
		if ( $this->dom_document instanceof DOMDocument ) {
			return $this->dom_document;
		}

		$this->finalize_writer_output();

		$dom                     = new DOMDocument( '1.0', 'UTF-8' );
		$dom->formatOutput       = true; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$dom->preserveWhiteSpace = false; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		// Load current XML content into DOM for compatibility with filters.
		@$dom->loadXML( implode( '', $this->chunks ) ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- Avoid fatal on unexpected content

		$this->dom_document = $dom;
		return $this->dom_document;
	}
}
