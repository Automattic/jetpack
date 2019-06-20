<?php

namespace Automattic\Jetpack\Sync;

/**
 * Very simple interface for encoding and decoding input
 * This is used to provide compression and serialization to messages
 **/
interface Codec_Interface {
	// we send this with the payload so we can select the appropriate decoder at the other end
	public function name();

	public function encode( $object );

	public function decode( $input );
}
