<?php
/**
 * Boot module asset shim.
 *
 * Wp-build 0.10.0+ no longer bundles @wordpress/boot.
 * The generated page.php template still looks for this file to determine classic script
 * prerequisites. This shim provides those dependencies so the template works correctly
 * while Core or jetpack-wp-build-polyfills provides the actual boot script module at runtime.
 *
 * @package automattic/jetpack-premium-analytics
 */

return array(
	'dependencies' => array(
		'react',
		'react-dom',
		'react-jsx-runtime',
		'wp-commands',
		'wp-components',
		'wp-compose',
		'wp-core-data',
		'wp-data',
		'wp-editor',
		'wp-element',
		'wp-html-entities',
		'wp-i18n',
		'wp-keyboard-shortcuts',
		'wp-keycodes',
		'wp-notices',
		'wp-primitives',
		'wp-private-apis',
		'wp-theme',
		'wp-url',
	),
	'version'      => '0.1.0',
);
