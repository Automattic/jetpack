<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-json-deflate-array-codec.php';

/**
 * An implementation of iJetpack_Sync_Codec that uses gzip's DEFLATE
 * algorithm to compress objects serialized using json_encode
 */
class Jetpack_Sync_Simple_Codec extends Jetpack_Sync_JSON_Deflate_Array_Codec {
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
