<?php
/**
 * Stands in for a Sync package released before WooCommerce_Analytics::is_woocommerce_supported().
 *
 * Require it from inside a process-isolated test, before anything autoloads the real class.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

// phpcs:disable WordPress.Files.FileName, Generic.Files.OneObjectStructurePerFile

namespace Automattic\Jetpack\Sync\Modules;

/**
 * Stub of the Sync module class without the support check.
 */
class WooCommerce_Analytics {}
