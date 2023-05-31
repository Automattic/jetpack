<?php
/**
 * Bootstrap.
 *
 * @package automattic/
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../../vendor/autoload.php';

/**
 * Load WorDBless.
 */
\WorDBless\Load::load();

/**
 * Patch the WorDBless custom $wpdb with a `db_server_info` method,
 * so that the WAF can use `dbDelta()` without errors.
 *
 * @todo Remove once https://github.com/Automattic/wordbless/pull/63 is merged.
 */
class Waf_Tests_WPDB extends \Db_Less_Wpdb {
	/**
	 * Mock for WordPress Options table.
	 *
	 * @var string
	 */
	public $options = 'wp_options';

	/**
	 * Mock for `wpdb::db_server_info`.
	 *
	 * @return bool Always false.
	 */
	public function db_server_info() {
		return false;
	}
}

global $wpdb;
$wpdb = new Waf_Tests_WPDB(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
