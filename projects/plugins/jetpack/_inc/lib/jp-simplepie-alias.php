<?php
/**
 * Class aliases for SimplePie.
 *
 * Core renamed the classes in 6.7, and for type declarations and such to work right we need to use the correct names.
 * This selects the correct alias file for the current version of WordPress.
 *
 * @todo Remove this once we drop support for WordPress 6.6
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

require_once ABSPATH . '/wp-includes/class-simplepie.php';
// @phan-suppress-next-line PhanUndeclaredClassReference -- Being tested for. @phan-suppress-current-line UnusedPluginSuppression
if ( class_exists( SimplePie\SimplePie::class ) ) {
	require_once __DIR__ . '/jp-simplepie-alias-new.php';
} else {
	require_once __DIR__ . '/jp-simplepie-alias-old.php';
}
