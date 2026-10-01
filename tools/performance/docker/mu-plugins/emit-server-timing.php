<?php
/**
 * Emit backend metrics for admin HTML responses in the performance fixture.
 *
 * @package automattic/jetpack-performance-testing
 */

if ( PHP_SAPI === 'cli' || ! is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
	return;
}

global $wpdb;

/**
 * Hold flushed chunks until response completion so headers precede the HTML.
 *
 * @param string $buffer Buffered output.
 * @param int    $phase  Output handler phase flags.
 * @return string Output to send to the next buffer.
 */
// Retain the database object even when PHP finalizes buffers after global teardown.
ob_start(
	static function ( $buffer, $phase ) use ( $wpdb ) {
		static $flushed = '';

		if ( $phase & PHP_OUTPUT_HANDLER_CLEAN ) {
			return '';
		}

		$flushed .= $buffer;
		if ( ! ( $phase & PHP_OUTPUT_HANDLER_FINAL ) ) {
			return '';
		}

		$content_type = '';
		foreach ( headers_list() as $header ) {
			if ( stripos( $header, 'Content-Type:' ) === 0 ) {
				$content_type = trim( substr( $header, strlen( 'Content-Type:' ) ) );
			}
		}
		$status = http_response_code();
		if ( ! headers_sent() && isset( $_SERVER['REQUEST_TIME_FLOAT'] ) && $status >= 200 && $status < 300 && stripos( $content_type, 'text/html' ) === 0 ) {
			header(
				sprintf(
					'Server-Timing: wp-total;dur=%.3F, wp-memory-usage;dur=%d, wp-db-queries;dur=%d',
					( microtime( true ) - (float) $_SERVER['REQUEST_TIME_FLOAT'] ) * 1000,
					memory_get_peak_usage(),
					$wpdb->num_queries
				),
				false
			);
		}

		return $flushed;
	}
);
