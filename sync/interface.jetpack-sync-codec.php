<?php

/**
 * Very simple interface for encoding and decoding input 
 * This is used to provide compression and serialization to messages
 **/
interface iJetpack_Sync_Codec {
	public function encode( $object );
	public function decode( $input );
}