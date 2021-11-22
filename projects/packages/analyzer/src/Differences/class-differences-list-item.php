<?php
/**
 * Abstract class that provides serialize API for `Differences` classes
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;

/**
 * Class Differences_List_Item
 */
abstract class Differences_List_Item extends PersistentListItem {
	/**
	 * Return array of declaration items.
	 *
	 * @return array
	 */
	public function to_csv_array() {
		$serializable = $this->get_serializable();

		return array_merge(
			array(
				$this->type(),
				$serializable->display_name(),
			),
			$serializable->to_csv_array()
		);
	}

	/**
	 * Returns serializable object.
	 *
	 * @return object
	 */
	abstract protected function get_serializable();

		/**
		 * Returns type of serializable.
		 *
		 * @return string
		 */
	abstract public function type();
}
