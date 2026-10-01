<?php
/**
 * Stand-in for WordPress.com's log2logstash(), which records each entry
 * instead of sending it.
 *
 * @package automattic/jetpack-mu-wpcom
 */

$GLOBALS['coming_soon_test_logstash'] = array();

/**
 * Record a logstash entry.
 *
 * @param array $payload Logstash record.
 */
function log2logstash( $payload ) {
	$GLOBALS['coming_soon_test_logstash'][] = $payload;
}
