<?php // phpcs:ignore WordPress.Files.FileName

$pluginDir = TEST_DATA_PATH . '/plugins/dummy_newer';

return array(
	'Jetpack\\AutoloaderTestData\\Plugin\\' => array(
		'version' => '2.0.0.0',
		'path'    => array( $pluginDir . '/src' ),
	),
);
