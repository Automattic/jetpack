<?php

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Tests all known implementations of the codec
 */
class WP_Test_Jetpack_Sync_Codec_Interface extends TestCase {

	public static $all_codecs;

	/**
	 * @dataProvider codec_provider
	 */
	public function test_sync_codec_encodes_objects( $codec ) {
		$object = (object) array(
			'b' => 'thang',
			'a' => 'thing',
		);

		$decoded_object = $codec->decode( $codec->encode( $object ) );

		$this->assertEquals( $object, $decoded_object );
	}

	/**
	 * @dataProvider codec_provider
	 */
	public function test_sync_codec_does_not_explode_on_circular_reference( $codec ) {
		$object_a = new stdClass();
		$object_b = new stdClass();

		$object_a->child = $object_b;
		$object_b->child = $object_a;

		// basically this function will explode unless there's some checks on infinite recursion
		$decoded_object = $codec->decode( $codec->encode( $object_a ) ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		// PHPUnit complains unless there's at least one assertion in the test.
		$this->assertTrue( true );
	}

	/**
	 * @dataProvider codec_provider
	 */
	public function test_codec_does_not_modify_original_object( $codec ) {

		$object = array(
			'a' => (object) array(
				'foo' => 1,
				'bar' => 2,
				'baz' => array( 'a', 'b', 'c' ),
			),
			'b' => array(),
		);

		// add a circular reference
		$object['b']['self'] = &$object;

		$copy_of_object = unserialize( serialize( $object ) );

		$decoded_object = $codec->decode( $codec->encode( $object ) );

		// unset the self references, since $copy_of_object will have them but other copies won't
		unset( $object['b']['self'] );
		unset( $decoded_object['b']['self'] );
		unset( $copy_of_object['b']['self'] );

		$this->assertEquals( $copy_of_object, $object );
		$this->assertEquals( $copy_of_object, $decoded_object );
	}

	public function codec_provider( $name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! self::$all_codecs ) {
			// detect classes that implement Automattic\Jetpack\Sync\Codec_Interface
			self::$all_codecs = array();

			foreach ( get_declared_classes() as $class_name ) {
				if ( in_array( 'Automattic\\Jetpack\\Sync\\Codec_Interface', class_implements( $class_name ), true ) ) {
					self::$all_codecs[] = $class_name;
				}
			}
		}

		$return = array();

		foreach ( self::$all_codecs as $codec_class ) {
			$instance = new $codec_class();
			$return[] = array( $instance );
		}

		return $return;
	}
}
