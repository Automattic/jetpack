<?php

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Sync\Codec_Interface;

/**
 * An implementation of Automattic\Jetpack\Sync\Codec_Interface that uses gzip's DEFLATE
 * algorithm to compress objects serialized using json_encode
 */
class JSON_Deflate_Array_Codec implements Codec_Interface {
	const CODEC_NAME = 'deflate-json-array';

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
	protected function json_serialize( $any ) {
		if ( function_exists( 'jetpack_json_wrap' ) ) {
			return wp_json_encode( jetpack_json_wrap( $any ) );
		}
		// This prevents fatal error when updating pre 6.0 via the cli command
		return wp_json_encode( $this->json_wrap( $any ) );
	}

	protected function json_unserialize( $str ) {
		return $this->json_unwrap( json_decode( $str, true ) );
	}

	private function json_wrap( &$any, $seen_nodes = array() ) {
		if ( is_object( $any ) ) {
			$input        = get_object_vars( $any );
			$input['__o'] = 1;
		} else {
			$input = &$any;
		}

		if ( is_array( $input ) ) {
			$seen_nodes[] = &$any;

			$return = array();

			foreach ( $input as $k => &$v ) {
				if ( ( is_array( $v ) || is_object( $v ) ) ) {
					if ( in_array( $v, $seen_nodes, true ) ) {
						continue;
					}
					$return[ $k ] = $this->json_wrap( $v, $seen_nodes );
				} else {
					$return[ $k ] = $v;
				}
			}

			return $return;
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
