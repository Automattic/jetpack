<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Class exists exclusively for backward compatibility.
 * Do not use.
 *
 * @deprecated $$next-version$$
 * @package automattic/jetpack
 */

/**
 * Bail if accessed directly
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Jetpack_Google_AMP_Analytics' ) ) {
	/**
	 * Class exists exclusively for backward compatibility.
	 * Do not use.
	 *
	 * @deprecated $$next-version$$
	 */
	class Jetpack_Google_AMP_Analytics extends Automattic\Jetpack\Google_Analytics\AMP_Analytics {
	}
}
