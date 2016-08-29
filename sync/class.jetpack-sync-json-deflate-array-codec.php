<?php

require_once dirname( __FILE__ ) . '/interface.jetpack-sync-codec.php';

/**
 * An implementation of iJetpack_Sync_Codec that uses gzip's DEFLATE
 * algorithm to compress objects serialized using json_encode
 */
class Jetpack_Sync_JSON_Deflate_Array_Codec implements iJetpack_Sync_Codec {
	const CODEC_NAME = "deflate-json-array";
	const MAX_DEPTH = 10;
	
	public function name() {
		return self::CODEC_NAME;
	}
	
	public function encode( $object ) {
		return base64_encode( gzdeflate( $this->json_serialize( $object ) ) );
	}

	public function decode( $input ) {
		return $this->json_unserialize( gzinflate( base64_decode( $input ) ) );
	}

	// @see https://gist.github.com/muhqu/820694
	private function json_serialize( $any ) {
		return json_encode( $this->json_wrap( $any ) );
	}

	private function json_unserialize( $str ) {
		$json = json_decode( $str, true );
		return $this->json_unwrap( $json );
	}

	private function json_wrap( $any, $depth = 1 ) {
		if ( $depth > self::MAX_DEPTH ) {
			return null;
		}

		if ( is_object( $any ) ) {
			$any = get_object_vars( $any );
			$any['__o'] = 1;
		}

		if ( is_array( $any ) ) {
			foreach ( $any as $k => $v ) {
				$any[ $k ] = $this->json_wrap( $v, $depth + 1 );
			}
		}

		return $any;
	}

	private function json_unwrap( $any ) {
		if ( is_array( $any ) ) {
			foreach ( $any as $k => $v ) {
				if ( '__o' === $k ) {
					continue;
				}
				$any[ $k ] = $this->json_unwrap( $v );
			}

			if ( isset( $any['__o'] ) ) {
				unset( $any['__o'] );
				$any = (object) $any;
			}
		}

		return $any;
	}
}