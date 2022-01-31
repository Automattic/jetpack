<?php
/**
 * PersistentList Item abstract.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\PersistentList;

/**
 * Class Item
 */
abstract class Item {
	/**
	 * Return array of declaration items.
	 *
	 * @return array
	 */
	abstract public function to_csv_array();
}
