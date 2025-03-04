<?php
/**
 * Test file for Automattic\Jetpack\Sync\Modules\Module
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Sync;

use WorDBless\BaseTestCase;

/**
 * Class Module_Test
 *
 * @covers Automattic\Jetpack\Sync\Modules\Module
 */
class Module_Test extends BaseTestCase {

	/**
	 * The module instance.
	 *
	 * @var \Automattic\Jetpack\Sync\Modules\Module
	 */
	private $module_instance;

	/**
	 * Runs before every test in this class.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->module_instance = $this->getMockBuilder( 'Automattic\Jetpack\Sync\Modules\Module' )
			->onlyMethods( array( 'id_field', 'name' ) )
			->getMock();
		$this->module_instance->method( 'id_field' )->willReturn( 'ID' );
		$this->module_instance->method( 'name' )->willReturn( 'module' );
	}
	/**
	 * Test filter_objects_and_metadata_by_size with no constraints of size
	 */
	public function test_filter_objects_and_metadata_by_size_no_constraints() {
		$objects  = array(
			(object) array(
				'ID'           => 1,
				'module_title' => 'Post 1',
			),
			(object) array(
				'ID'           => 2,
				'module_title' => 'Post 2',
			),
		);
		$metadata = array(
			(object) array(
				'module_id'  => 1,
				'meta_value' => 'meta1',
			),
		);

		$result = $this->module_instance->filter_objects_and_metadata_by_size( 'module', $objects, $metadata, PHP_INT_MAX, PHP_INT_MAX );

		$this->assertCount( 2, $result[0] );
		$this->assertCount( 2, $result[1] );
		$this->assertCount( 1, $result[2] );
		$this->assertSame( array( '1', '2' ), $result[0] );
		$this->assertSame( $objects, $result[1] );
		$this->assertSame( $metadata, $result[2] );
	}

	/**
	 * Test filter_objects_and_metadata_by_size with no constraints of size objects being an array
	 */
	public function test_filter_objects_and_metadata_by_size_no_constraints_object_being_array() {
		$objects  = array(
			array(
				'ID'           => 1,
				'module_title' => 'Element 1',
			),
			array(
				'ID'           => 2,
				'module_title' => 'Element 2',
			),
		);
		$metadata = array(
			(object) array(
				'module_id'  => 1,
				'meta_value' => 'meta1',
			),
		);

		$result = $this->module_instance->filter_objects_and_metadata_by_size( 'module', $objects, $metadata, PHP_INT_MAX, PHP_INT_MAX );
		$this->assertCount( 2, $result[0] );
		$this->assertCount( 2, $result[1] );
		$this->assertCount( 1, $result[2] );
		$this->assertSame( array( '1', '2' ), $result[0] );
		$this->assertSame( $objects, $result[1] );
		$this->assertSame( $metadata, $result[2] );
	}
	/**
	 * Test filter_objects_and_metadata_by_size with constraints of size for metadata
	 */
	public function test_filter_objects_exceeding_max_meta_size() {
		$objects  = array(
			(object) array(
				'ID'           => 1,
				'module_title' => 'Post 1',
			),
		);
		$metadata = array(
			(object) array(
				'module_id'  => 1,
				'meta_value' => str_repeat( 'a', 100 ),
			),
		);

		$result = $this->module_instance->filter_objects_and_metadata_by_size( 'module', $objects, $metadata, 50, 200 );

		$this->assertSame( '', $result[2][0]->meta_value );
	}
	/**
	 * Test filter_objects_and_metadata_by_size with constraints of size for total size
	 */
	public function test_filter_objects_exceeding_max_total_size() {
		$objects  = array(
			(object) array(
				'ID'           => 1,
				'module_title' => 'Post 1',
			),
			(object) array(
				'ID'           => 2,
				'module_title' => 'Post 2',
			),
		);
		$metadata = array(
			(object) array(
				'module_id'  => 1,
				'meta_value' => 'meta1',
			),
		);

		$result = $this->module_instance->filter_objects_and_metadata_by_size( 'module', $objects, $metadata, 50, 10 );

		$this->assertCount( 1, $result[0] ); // Should only include the first object
	}
}
