<?php
/**
 * Exception for Utils::loadChangeFile()
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

use RuntimeException;

/**
 * Exception for Utils::loadChangeFile()
 */
class LoadChangeFileException extends RuntimeException {

	/**
	 * Line number in the file where the exception occurred, if any.
	 *
	 * @var int|null
	 */
	public $fileLine;
}
