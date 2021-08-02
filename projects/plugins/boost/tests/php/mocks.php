<?php //phpcs:ignore Squiz.Commenting.FileComment.Missing

\WP_Mock::userFunction(
	'plugin_dir_path',
	array(
		'return' => function ( $file ) {
			return dirname( $file ) . '/';
		},
	)
);
