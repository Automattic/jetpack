<?php
/**
 * Recorder for the `queue_async_job()` stub in wpcom-async-job-functions.php.
 *
 * @package automattic/jetpack-seo
 */

/**
 * Jobs queued through the WordPress.com async job stub.
 */
class Wpcom_Test_Async_Jobs {

	/**
	 * Queued jobs, each `array( 'type' => string, 'data' => array )`.
	 *
	 * @var array[]
	 */
	public static $queued = array();
}
