<?php
/**
 * Tests for the viewer history table store.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Table_History_Store;
use Automattic\Jetpack\VideoPress\Viewer_History;
use WorDBless\BaseTestCase;

/**
 * Test suite for Table_History_Store.
 */
class Table_History_Store_Test extends BaseTestCase {

	/**
	 * Before the first write the table does not exist, so deleting any user must not query it.
	 */
	public function test_reads_and_erasure_skip_the_table_until_it_exists() {
		delete_option( Table_History_Store::VERSION_OPTION );
		Viewer_History::reset();
		$queries = array();
		$capture = function ( $sql ) use ( &$queries ) {
			$queries[] = $sql;
			return $sql;
		};
		add_filter( 'query', $capture );

		Viewer_History::forget_user( 3 );
		$store = new Table_History_Store();
		$this->assertNull( $store->get( 3, 'abcd1234' ) );
		$this->assertSame( array(), $store->list_recent( 3, 10 ) );
		$this->assertSame( 0, $store->purge( time(), time() ) );

		remove_filter( 'query', $capture );
		$this->assertSame( array(), preg_grep( '/' . Table_History_Store::TABLE . '/', $queries ) );
	}
}
