<?php //phpcs:ignore Squiz.Commenting.FileComment.Missing

use Brain\Monkey\Functions;

Functions\when( 'plugin_dir_path' )->alias(
	function ( $file ) {
		return dirname( $file ) . '/';
	}
);

Functions\when( 'sanitize_key' )->alias(
	function ( $key ) {
		return strtolower( preg_replace( '/[^a-z0-9_\-]/', '', $key ) );
	}
);
