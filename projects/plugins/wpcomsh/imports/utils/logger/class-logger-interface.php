<?php
/**
 * LoggerInterface file.
 *
 * @package wpcomsh
 */

namespace Imports\Utils;

/**
 * Interface LoggerInterface
 *
 * The LoggerInterface defines a standard interface for logging messages.
 * It declares a log method that classes implementing this interface must provide.
 */
interface LoggerInterface {
	/**
	 * Logs a message.
	 *
	 * This method logs a message. The specifics of how the message is logged
	 * (e.g., to a file, to the console, etc.) are up to the classes that implement this interface.
	 *
	 * @param string $message The message to log.
	 */
	public function log( $message );
}
