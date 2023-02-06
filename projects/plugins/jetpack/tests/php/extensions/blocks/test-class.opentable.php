<?php
/**
 * OpenTable Block tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\OpenTable;
require_once JETPACK__PLUGIN_DIR . '/extensions/blocks/opentable/opentable.php';

/**
 * OpenTable block tests
 */
class WP_Test_OpenTable extends \WP_UnitTestCase {

	/**
	 * `load_assets` with empty attributes
	 */
	public function test_load_assets_with_empty_attributes() {
		$attributes = array();
		$content    = OpenTable\load_assets( $attributes );

		$this->assertTrue( is_string( $content ) );
	}

	/**
	 * `load_assets` with `rid` attribute set to null
	 */
	public function test_load_assets_rid_not_valid() {
		$attributes = array( 'rid' => null );
		$content    = OpenTable\load_assets( $attributes );

		$this->assertTrue( is_string( $content ) );
	}

	/**
	 * `load_assets` with `rid` as array
	 */
	public function test_load_assets_rid_empty_array() {
		$attributes = array( 'rid' => array() );
		$content    = OpenTable\load_assets( $attributes );

		$this->assertTrue( is_string( $content ) );
	}
}
