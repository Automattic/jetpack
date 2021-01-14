<?php // phpcs:ignore WordPress.Files.FileName

$pluginDir = TEST_DATA_PATH . '/plugins/plugin_current';

return array(
	'Automattic\\Jetpack\\Autoloader\\AutoloadGenerator' => array(
		'version' => '2.6.0.0',
		'path'    => dirname( dirname( dirname( TEST_DATA_PATH ) ) ) . '/src/AutoloadGenerator.php',
	),
	'Jetpack\\AutoloaderTestData\\Plugin\\Test' => array(
		'version' => '2.6.0.0',
		'path'    => $pluginDir . '/includes/class-test.php',
	)
);
