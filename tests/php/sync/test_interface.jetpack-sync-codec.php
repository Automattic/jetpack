<?php

/*
 * Tests all known implementations of the codec
 *
 * @requires PHP 5.3
 */

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	$sync_dir = ABSPATH . 'wp-content/mu-plugins/jetpack/sync/';
} else {
	$sync_dir = dirname( __FILE__ ) . '/../../../sync/';	
}


require_once $sync_dir . 'class.jetpack-sync-json-deflate-array-codec.php';
require_once $sync_dir . 'class.jetpack-sync-json-deflate-codec.php';

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

	/**
	 * @dataProvider codec_provider
	 * @requires PHP 5.3
	 */
	public function test_codec_doesnt_introduce_large_memory_overhead( $codec ) {
		error_log(get_class($codec));
		$large_object = array();

		foreach( range( 1, 1000 ) as $i ) {
			$large_object["entry_$i"] = $this->long_random_string( 100 );
		}

		$before_mem = memory_get_usage();
		// $before_peak = memory_get_peak_usage();

		$response = $codec->encode( $large_object );

		$after_mem = memory_get_usage();
		$after_peak = memory_get_peak_usage();

		error_log("Memory added: ".($after_mem-$before_mem));
		error_log("Peak: $after_peak");
	}

	private function long_random_string( $length ) {
		// we generate a random string so it's hard to compress (i.e. doesn't shrink when gzencoded)
		$characters       = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		$charactersLength = strlen( $characters );
		$randomString     = '';
		for ( $i = 0; $i < $length; $i ++ ) {
			$randomString .= $characters[ rand( 0, $charactersLength - 1 ) ];
		}

		return $randomString;
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