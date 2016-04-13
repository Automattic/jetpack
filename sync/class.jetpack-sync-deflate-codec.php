<?php

require_once dirname(__FILE__) . '/interface.jetpack-sync-codec.php';

/**
 * An implementation of iJetpack_Sync_Codec that uses gzip's DEFLATE
 * algorithm to compress objects serialized using PHP's default 
 * serializer
 */
class Jetpack_Sync_Deflate_Codec implements iJetpack_Sync_Codec {
	public function encode( $object ) {
		return gzdeflate( serialize( $object ) );
	}

	public function decode( $input ) {
		return unserialize( gzinflate( $input ) );
	}
}