<?php // phpcs:ignore WordPress.Files.FileName

$pluginDir = TEST_DATA_PATH . '/plugins/dummy_dev';

return array(
	'Jetpack\\AutoloaderTestData\\Plugin\\' => array(
		'version' => 'dev-main',
		'path'    => array( $pluginDir . '/src' ),
	),
);
