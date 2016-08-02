<?php

require_once dirname( __FILE__ ) . '/interface.jetpack-sync-codec.php';

/**
 * An implementation of iJetpack_Sync_Codec that uses gzip's DEFLATE
 * algorithm to compress objects serialized using json_encode
 */
class Jetpack_Sync_JSON_Deflate_Codec implements iJetpack_Sync_Codec {
	const CODEC_NAME = 'deflate-json';

	public function name() {
		return self::CODEC_NAME;
	}

	public function encode( $object ) {
		return base64_encode( gzdeflate( $this->json_serialize( unserialize( serialize( $object ) ) ) ) );
	}

	public function decode( $input ) {
		return $this->json_unserialize( gzinflate( base64_decode( $input ) ) );
	}

	// @see https://gist.github.com/muhqu/820694
	private function json_serialize( $any ) {
		return json_encode( $this->json_wrap( $any ) );
	}

	private function json_unserialize( $str ) {
		return $this->json_unwrap( json_decode( $str ) );
	}

	private function json_wrap( $any, $skip_assoc = false ) {
		if ( ! $skip_assoc && is_array( $any ) && is_string( key( $any ) ) ) {
			return (object) array( '_PHP_ASSOC' => $this->json_wrap( $any, true ) );
		}
		if ( is_array( $any ) || is_object( $any ) ) {
			foreach ( $any as &$v ) {
				$v = $this->json_wrap( $v );
			}
		}

		return $any;
	}

	private function json_unwrap( $any, $skip_assoc = false ) {
		if ( ! $skip_assoc && is_object( $any ) && isset( $any->_PHP_ASSOC ) && count( (array) $any ) == 1 ) {
			return (array) $this->json_unwrap( $any->_PHP_ASSOC );
		}
		if ( is_array( $any ) || is_object( $any ) ) {
			foreach ( $any as &$v ) {
				$v = $this->json_unwrap( $v );
			}
		}

		return $any;
	}
}
