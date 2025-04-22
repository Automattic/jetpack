<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

/**
 * Class LCP_Optimizer
 *
 * Handles the optimization of LCP (Largest Contentful Paint) images.
 */
class LCP_Optimizer {
	/**
	 * Optimize the HTML content by finding the LCP image and adding required attributes.
	 *
	 * @param string $buffer_start First part of the buffer.
	 * @param string $buffer_end   Second part of the buffer.
	 *
	 * @return array Parts of the buffer.
	 *
	 * @since 3.13.1
	 */
	public function optimize( $buffer_start, $buffer_end ) {
		// Get the LCP image tag from WP option
		$storage = new LCP_Storage();

		$lcp_storage = $storage->get_current_request_lcp();
		// Early return if we don't have any LCP data
		if ( empty( $lcp_storage ) ) {
			return array( $buffer_start, $buffer_end );
		}

		// Combine the buffers for processing
		$combined_buffer = $buffer_start . $buffer_end;

		foreach ( $lcp_storage as $lcp_data ) {
			$combined_buffer = $this->optimize_viewport( $combined_buffer, $lcp_data );
		}

		// Split the modified buffer back into two parts
		$buffer_start_length = strlen( $buffer_start );
		$new_buffer_start    = substr( $combined_buffer, 0, $buffer_start_length );
		$new_buffer_end      = substr( $combined_buffer, $buffer_start_length );

		// Check for successful split
		if ( false === $new_buffer_start || false === $new_buffer_end ) {
			// If splitting failed, return the original buffers
			return array( $buffer_start, $buffer_end );
		}

		return array( $new_buffer_start, $new_buffer_end );
	}

	/**
	 * Optimize a viewport
	 *
	 * @param string $buffer The buffer/html to optimize.
	 * @param array  $lcp_data The LCP data returned from the Cloud.
	 * @return string The optimized buffer, or the original buffer if no optimization was needed
	 *
	 * @since 3.13.1
	 */
	private function optimize_viewport( $buffer, $lcp_data ) {
		if ( empty( $lcp_data ) || empty( $lcp_data['html'] ) ) {
			return $buffer;
		}

		// Defensive check to ensure the LCP HTML is not empty.
		if ( empty( $lcp_data['html'] ) ) {
			return $buffer;
		}

		// Remove the last (closing) character from the LCP HTML in case the buffer adds a closing forward slash to the img tag. Which is not found by the Cloud.
		$lcp_html = substr( $lcp_data['html'], 0, -1 );

		// If the LCP HTML is not found in the buffer, return early.
		if ( ! str_contains( $buffer, $lcp_html ) ) {
			return $buffer;
		}

		// Create the optimized tag with required attributes.
		$optimized_tag = $this->optimize_image_tag( $lcp_html );

		// If no optimization was needed, return early.
		if ( $optimized_tag === $lcp_html ) {
			return $buffer;
		}

		return str_replace( $lcp_html, $optimized_tag, $buffer );
	}

	/**
	 * Optimize an image tag by adding required attributes.
	 *
	 * @param string $tag The original image tag.
	 * @return string The optimized image tag.
	 *
	 * @since 3.13.1
	 */
	private function optimize_image_tag( $tag ) {
		// Add fetchpriority="high" if not present
		if ( ! preg_match( '/fetchpriority\s*=\s*["\']high["\']/i', $tag ) ) {
			$tag = preg_replace( '/<img\s/i', '<img fetchpriority="high" ', $tag );
		}

		// Add loading="eager" if not present
		if ( ! preg_match( '/loading\s*=\s*["\']eager["\']/i', $tag ) ) {
			$tag = preg_replace( '/<img\s/i', '<img loading="eager" ', $tag );
		}

		return $tag;
	}
}
