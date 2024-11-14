<?php
/**
 * Backup_Import_Action file.
 *
 * @package wpcomsh
 */

namespace Imports;

use WP_Error;
/**
 * Abstract class provide common actions between classes.
 *
 * This class provides a common interface for all backup importers.
 */
abstract class Backup_Import_Action {
	/**
	 * An optional logger for logging operations.
	 *
	 * @var Utils\Logger\FileLogger|null
	 */
	protected $logger;

	/**
	 * Constructs a new instance of the Backup_Import_Action class.
	 *
	 * @param Utils\Logger\FileLogger|null $logger An instance of FileLogger for logging messages. Default is null.
	 */
	public function __construct( $logger = null ) {
		$this->logger = $logger;
	}

	/**
	 * Logs a message.
	 *
	 * @param string $message The message to log.
	 */
	protected function log( $message ) {
		if ( $this->logger ) {
			$this->logger->log( $message );
		}
	}

	/**
	 * Logs an error if a logger is set and generates a WP_Error.
	 *
	 * @param string $code    The error code.
	 * @param string $message The error message.
	 *
	 * @return WP_Error
	 */
	protected function error( $code, $message ) {
		$this->log( "Error: {$code} {$message}" );

		return new WP_Error( $code, $message );
	}
}
