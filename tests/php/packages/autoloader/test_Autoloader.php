<?php

use Automattic\Jetpack\Autoloader;

class WP_Test_Autoloader extends WP_UnitTestCase {
	function setup() {
		global $jetpack_packages_classes;
		$jetpack_packages_classes = array();
	}

	function test_enqueueing_adds_to_the_global_array() {
		global $jetpack_packages_classes;
		enqueue_package( 'className', '1', 'path_to_class' );
		$this->assertTrue( isset( $jetpack_packages_classes['className'] ) );
		$this->assertEquals( $jetpack_packages_classes['className']['version'], '1' );
		$this->assertEquals( $jetpack_packages_classes['className']['path'], 'path_to_class' );
	}

	function test_enqueueing_adds_the_latest_version_to_the_global_array() {

		global $jetpack_packages_classes;
		enqueue_package( 'className', '1', 'path_to_class' );
		enqueue_package( 'className', '2', 'path_to_class_v2' );
		$this->assertTrue( isset( $jetpack_packages_classes['className'] ) );
		$this->assertEquals( $jetpack_packages_classes['className']['version'], '2' );
		$this->assertEquals( $jetpack_packages_classes['className']['path'], 'path_to_class_v2' );

	}

	function test_enqueueing_always_adds_the_dev_version_to_the_global_array() {
		global $jetpack_packages_classes;
		enqueue_package( 'className', '1', 'path_to_class' );
		enqueue_package( 'className', 'dev-howdy', 'path_to_class_dev' );
		enqueue_package( 'className', '2', 'path_to_class_v2' );
		$this->assertTrue( isset( $jetpack_packages_classes['className'] ) );
		$this->assertEquals( $jetpack_packages_classes['className']['version'], 'dev-howdy' );
		$this->assertEquals( $jetpack_packages_classes['className']['path'], 'path_to_class_dev' );
	}

}
