<?php // phpcs:ignore WordPress.Files.FileName

$pluginDir = TEST_DATA_PATH . '/plugins/dummy_current';

return array(
	'Jetpack\\AutoloaderTestData\\Plugin\\' => array(
		'version' => '1.0.0.0',
		'path'    => array( $pluginDir . '/src' ),
	),
);
