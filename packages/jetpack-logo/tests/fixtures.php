<?php

$current = dirname( __FILE__ );
define( 'WP_CONTENT_DIR', realpath ( $current . '/../../../../..' ) );

function esc_url( $URL ) {
	return $URL;
}

function esc_attr__( $string, $namespace ) {
	return $string;
}

function content_url( $path ) {
	return 'https://example.com/wp-content'. $path;
}

function home_url( $path ) {
	return 'https://example.com' . $path;
}