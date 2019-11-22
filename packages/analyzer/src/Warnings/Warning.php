<?php
/**
 * Warnings processing of Persistent List items.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Warnings;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;

/**
 * Class Warning
 */
class Warning extends PersistentListItem {
	/**
	 * Type.
	 *
	 * @var string
	 */
	public $type;

	/**
	 * Path.
	 *
	 * @var string
	 */
	public $path;

	/**
	 * Line.
	 *
	 * @var string
	 */
	public $line;

	/**
	 * Message.
	 *
	 * @var string
	 */
	public $message;

	/**
	 * Old declaration.
	 *
	 * @var object
	 */
	public $old_declaration;

	/**
	 * Warning constructor.
	 *
	 * @param string $type Type.
	 * @param string $path Path.
	 * @param string $line Line.
	 * @param string $message Message.
	 * @param object $old_declaration Previous declaration.
	 */
	public function __construct( $type, $path, $line, $message, $old_declaration ) {
		$this->type            = $type;
		$this->path            = $path;
		$this->line            = $line;
		$this->message         = $message;
		$this->old_declaration = $old_declaration;
	}

	/**
	 * This key is used to identify unique issues (e.g. Jetpack_Options has moved) across multiple invocations
	 */
	public function unique_issue_key() {
		return $this->type . ',' . $this->old_declaration->path . ',' . $this->old_declaration->line . ',' . $this->old_declaration->display_name();
	}

	/**
	 * Returns an array of the Warnings item.
	 *
	 * @return array Array of CSV items.
	 */
	public function to_csv_array() {
		return array(
			$this->type,
			$this->path,
			$this->line,
			$this->message,
			$this->old_declaration->display_name(),
		);
	}
}
