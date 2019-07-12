<?php

namespace Automattic\Jetpack\Sync;

/**
 * An implementation of Automattic\Jetpack\Sync\Codec_Interface that uses gzip's DEFLATE
 * algorithm to compress objects serialized using json_encode
 */
class Simple_Codec extends JSON_Deflate_Array_Codec {
	const CODEC_NAME = 'simple';

	public function name() {
		return self::CODEC_NAME;
	}

	public function encode( $object ) {
		return base64_encode( $this->json_serialize( $object ) );
	}

	public function decode( $input ) {
		return $this->json_unserialize( base64_decode( $input ) );
	}

}
