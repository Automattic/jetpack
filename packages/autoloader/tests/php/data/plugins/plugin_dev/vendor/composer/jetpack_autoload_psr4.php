<?php // phpcs:ignore WordPress.Files.FileName

$pluginDir = TEST_DATA_PATH . '/plugins/plugin_dev';

return array(
	'Jetpack\\AutoloaderTestData\\Plugin\\' => array(
		'version' => 'dev-main',
		'path'    => array( $pluginDir . '/src' ),
	),
);
