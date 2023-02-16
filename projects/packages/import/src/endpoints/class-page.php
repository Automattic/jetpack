<?php
/**
 * Pages REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

/**
 * Class Page
 */
class Page extends Post {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'page' );
	}

	/**
	 * Update the post parent ID.
	 *
	 * @param int $resource_id      The resource ID.
	 * @param int $parent_import_id The parent ID.
	 * @return bool True if updated.
	 */
	protected function update_parent_id( $resource_id, $parent_import_id ) {
		$pages = \get_pages( $this->get_import_db_query( $parent_import_id ) );

		if ( is_array( $pages ) && count( $pages ) === 1 ) {
			$parent_id = $pages[0]->ID;

			return (bool) \wp_update_post(
				array(
					'ID'          => $resource_id,
					'post_parent' => $parent_id,
				)
			);
		}

		return false;
	}
}
