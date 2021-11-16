<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Exception class used for fatal configuration errors.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

use RuntimeException;

/**
 * Exception class used for fatal configuration errors.
 *
 * @since 1.2.0
 */
class ConfigException extends RuntimeException {
}
