<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Class exists exclusively for backward compatibility.
 * Do not use.
 *
 * @deprecated 13.5
 * @package automattic/jetpack
 */

/**
 * Bail if accessed directly
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/classes/wp-google-analytics-utils.php';
require_once __DIR__ . '/classes/wp-google-analytics-options.php';
require_once __DIR__ . '/classes/wp-google-analytics-legacy.php';
require_once __DIR__ . '/classes/wp-google-analytics-universal.php';
require_once __DIR__ . '/classes/class-jetpack-google-amp-analytics.php';

if ( ! class_exists( 'Jetpack_Google_Analytics' ) ) {
	/**
	 * Class exists exclusively for backward compatibility.
	 * Do not use.
	 *
	 * @deprecated 13.5
	 */
	class Jetpack_Google_Analytics extends Automattic\Jetpack\Google_Analytics\GA_Manager {
	}
}
