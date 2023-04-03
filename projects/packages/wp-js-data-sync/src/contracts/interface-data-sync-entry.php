<?php
/**
 * Data_Sync_Entries manage the data of a single entry.
 * Each entry has:
 *      - a key
 *      - a storage driver
 *      - handler that deals with data validation, sanitization.
 *
 * This class pulls all those together and provides a simple interface to get/set/delete data.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */
namespace Automattic\Jetpack\WP_JS_Data_Sync\Contracts;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Type;

interface Data_Sync_Entry {

	public function __construct( $namespace, $key, $schema );

	public function get();

}
