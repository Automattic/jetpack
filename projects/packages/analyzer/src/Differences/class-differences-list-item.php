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
	 * Returns a serializable representation of the object.
	 *
	 * @return array
	 */
	public function to_map() {
		$serializable = $this->get_serializable();

		$result = array(
			'diff_type'       => $this->type(),
			'display_name'    => $serializable['old_declaration']->display_name(),
			'old_declaration' => $serializable['old_declaration']->to_map(),
		);

		if ( array_key_exists( 'new_declaration', $serializable ) ) {
			$result = array_merge(
				$result,
				array(
					'new_declaration' => $serializable['new_declaration']->to_map(),
				)
			);
		}

		return $result;
	}

	/**
	 * Return array of declaration items.
	 *
	 * @return array
	 */
	public function to_csv_array() {
		// Dummy implementation to workaround subclass check in PersistentList::add.
		return array();
	}

	/**
	 * Returns serializable object.
	 *
	 * @return array
	 */
	abstract protected function get_serializable();

		/**
		 * Returns type of serializable.
		 *
		 * @return string
		 */
	abstract public function type();
}
