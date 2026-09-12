<?php
/**
 * Test helper trait for reading a block's editor availability entry.
 *
 * @package automattic/jetpack
 */

/**
 * Reads one block's entry from the availability list the editor receives.
 */
trait Reads_Block_Availability {

	/**
	 * Read the block's entry from the availability list the editor receives.
	 *
	 * Limits the list to this block and treats the site as connected so the
	 * list is computed at all.
	 *
	 * @param string $slug Block slug without the `jetpack/` prefix.
	 * @return array The block's availability entry.
	 */
	protected function get_block_availability( $slug ) {
		$only_this_block = static function () use ( $slug ) {
			return array( $slug );
		};
		add_filter( 'jetpack_set_available_extensions', $only_this_block, 1000 );
		// Atomic (wpcomsh) test runs hook these at default priority, so run late.
		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		add_filter( 'jetpack_gutenberg', '__return_true', 1000 );

		$availability = Jetpack_Gutenberg::get_availability();

		remove_filter( 'jetpack_set_available_extensions', $only_this_block, 1000 );
		remove_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		remove_filter( 'jetpack_gutenberg', '__return_true', 1000 );

		return $availability[ $slug ];
	}
}
