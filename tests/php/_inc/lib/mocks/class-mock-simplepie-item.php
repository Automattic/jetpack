<?php
/**
 * Mock class to help make Jetpack_Podcast_Helper more testable.
 *
 * @package jetpack
 */

/**
 * Class Mock_SimplePie_Item.
 */
class Mock_SimplePie_Item {
	/**
	 * Holds ID.
	 *
	 * @var int
	 */
	private $id;

	/**
	 * Mock_SimplePie_Item constructor.
	 *
	 * @param int $id ID.
	 */
	public function __construct( $id ) {
		$this->id = $id;
	}

	/**
	 * Returns ID.
	 *
	 * @return int
	 */
	public function get_id() {
		return $this->id;
	}
}
