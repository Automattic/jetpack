<?php //phpcs:ignore Squiz.Commenting.FileComment.Missing

use Brain\Monkey\Functions;

Functions\when( 'plugin_dir_path' )->alias(
	function ( $file ) {
		return dirname( $file ) . '/';
	}
);
