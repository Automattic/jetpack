<?php
/**
 * Uses standard output buffering implemented to PHP
 * to allow for manipulating the output stream.
 *
 * The implementation allows for seamless text search and manipulation by
 * always taking into account two subsequent chunks of data.
 *
 * Example sequence of chunks sent to output (chunk size 4):
 *
 * ABCD EFGH IJKL MNOP QRST
 *
 * A standard output buffer callback handler would always receive only one
 * of those chunks, e.g. 'ABCD' and would be unable to match strings on
 * seams of individual chunks, e.g. 'DEF', because 'D' appears in chunk #1,
 * whereas 'EF' in chunk #2.
 *
 * This class solves this issue by utilizing a sliding window of size 2 chunks.
 * That means the callback receives:
 *
 * ABCDEFGH EFEGHIJKL IJKLMNOP MNOPQRST
 *
 * That allows for more advanced string manipulation even across chunk seams.
 * It is assumed any string searches are much shorter than a chunk size.
 *
 * @link       https://automattic.com
 * @since      0.2.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Output_Filter
 */
class Output_Filter {

	/**
	 * Output chunk size.
	 */
	const CHUNK_SIZE = 4096;

	/**
	 * List of callbacks.
	 *
	 * @var array
	 */
	private $callbacks = array();

	/**
	 * One chunk always remains in the buffer to allow for cross-seam matching.
	 *
	 * @var string|null
	 */
	private $buffered_chunk;

	/**
	 * Whether we allow the callbacks to filter incoming chunks of output.
	 *
	 * @var boolean
	 */
	private $is_filtering = false;

	/**
	 * Add an output filtering callback.
	 *
	 * @param callable $callback Output filtering callback.
	 *
	 * @return void
	 */
	public function add_callback( $callback ) {
		$this->callbacks[] = $callback;

		if ( 1 === count( $this->callbacks ) ) {
			// Start filtering output now that we have some callbacks.
			$this->is_filtering = true;

			ob_start(
				array( $this, 'tick' ),
				self::CHUNK_SIZE
			);
		}
	}

	/**
	 * Processing a full output buffer.
	 *
	 * @param string $buffer Output buffer.
	 * @param int    $phase  Bitmask of PHP_OUTPUT_HANDLER_* constants.
	 *
	 * @return string Buffer data to be flushed to browser.
	 */
	public function tick( $buffer, $phase ) {
		// Don't do anything if we're not support to do any filtering.
		if ( ! $this->is_filtering ) {
			return $buffer;
		}

		if ( ! isset( $this->buffered_chunk ) ) {
			$this->buffered_chunk = $buffer;

			return '';
		}

		$buffer_start = $this->buffered_chunk;
		$buffer_end   = $buffer;

		foreach ( $this->callbacks as $callback ) {
			list( $buffer_start, $buffer_end ) = call_user_func( $callback, $buffer_start, $buffer_end );
		}
		$this->buffered_chunk = $buffer_end;
		$joint_buffer         = $buffer_start . $buffer_end;

		// If the second part of the buffer is the last chunk,
		// merge the buffer back together to ensure whole output.
		if ( PHP_OUTPUT_HANDLER_END === $phase ) {
			// If more buffer chunks arrive, don't apply callbacks to them.
			$this->is_filtering = false;

			// Join remaining buffers and allow plugin to append anything to them.
			return apply_filters( 'jetpack_boost_output_filtering_last_buffer', $joint_buffer, $buffer_start, $buffer_end );
		}

		// Send the first part of the whole buffer to the browser only,
		// because buffer_end will be manipulated in the next tick.
		return $buffer_start;
	}
}
