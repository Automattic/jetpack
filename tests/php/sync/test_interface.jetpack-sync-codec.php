<?php

/*
 * Tests all known implementations of the codec
 *
 * @requires PHP 5.3
 */

class WP_Test_iJetpack_Sync_Codec extends PHPUnit_Framework_TestCase {

	static $all_codecs;

	/**
	 * @dataProvider codec_provider
	 * @requires PHP 5.3
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
	 * @requires PHP 5.3
	 */
	public function test_sync_codec_does_not_explode_on_circular_reference( $codec ) {
		$object_a = new stdClass();
		$object_b = new stdClass();

		$object_a->child = $object_b;
		$object_b->child = $object_a;

		// basically this function will explode unless there's some checks on infinite recursion
		$decoded_object = $codec->decode( $codec->encode( $object_a ) );
	}

	/**
	 * @dataProvider codec_provider
	 * @requires PHP 5.3
	 */
	public function test_codec_does_not_modify_original_object( $codec ) {

		$object = array(
			'a' => (object) array(
				'foo' => 1,
				'bar' => 2,
				'baz' => array( 'a', 'b', 'c' ),
			),
			'b' => array()
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

	public function codec_provider( $name ) {
		if ( ! self::$all_codecs ) {
			// detect classes that implement iJetpack_Sync_Codec
			self::$all_codecs = array();

			foreach ( get_declared_classes() as $className ) {
				if ( in_array( 'iJetpack_Sync_Codec', class_implements( $className ) ) ) {
					self::$all_codecs[] = $className;
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
