<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Class exists exclusively for backward compatibility.
 * Do not use.
 *
 * @deprecated 13.5
 */

/**
 * Bail if accessed directly
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Jetpack_Google_Analytics_Utils' ) ) {
	/**
	 * Class exists exclusively for backward compatibility.
	 * Do not use.
	 *
	 * @deprecated 13.5
	 */
	class Jetpack_Google_Analytics_Utils extends Automattic\Jetpack\Google_Analytics\Utils {
	}
}
