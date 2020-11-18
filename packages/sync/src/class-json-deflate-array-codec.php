<?php
/**
 * An implementation of Automattic\Jetpack\Sync\Codec_Interface that uses gzip's DEFLATE
 * algorithm to compress objects serialized using json_encode.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

/**
 * An implementation of Automattic\Jetpack\Sync\Codec_Interface that uses gzip's DEFLATE
 * algorithm to compress objects serialized using json_encode
 */
class JSON_Deflate_Array_Codec implements Codec_Interface {
	const CODEC_NAME = 'deflate-json-array';

	/**
	 * Return the name of the codec.
	 *
	 * @return string
	 */
	public function name() {
		return self::CODEC_NAME;
	}

	/**
	 * Encodes an object.
	 *
	 * @param object $object Item to encode.
	 * @return string
	 */
	public function encode( $object ) {
		return base64_encode( gzdeflate( $this->json_serialize( $object ) ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
	}

	/**
	 * Decode compressed serialized value.
	 *
	 * @param string $input Item to decode.
	 * @return array|mixed|object
	 */
	public function decode( $input ) {
		return $this->json_unserialize( gzinflate( base64_decode( $input ) ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
	}

	/**
	 * Serialize JSON
	 *
	 * @see https://gist.github.com/muhqu/820694
	 *
	 * @param string $any Value to serialize and wrap.
	 *
	 * @return false|string
	 */
	protected function json_serialize( $any ) {
		if ( function_exists( 'jetpack_json_wrap' ) ) {
			return wp_json_encode( jetpack_json_wrap( $any ) );
		}
		// This prevents fatal error when updating pre 6.0 via the cli command.
		return wp_json_encode( $this->json_wrap( $any ) );
	}

	/**
	 * Unserialize JSON
	 *
	 * @param string $str JSON string.
	 * @return array|object Unwrapped JSON.
	 */
	protected function json_unserialize( $str ) {
		return $this->json_unwrap( json_decode( $str, true ) );
	}

	/**
	 * Wraps JSON
	 *
	 * @param object|array $any Wrapping value.
	 * @param array        $seen_nodes Seen nodes.
	 * @return array
	 */
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

	/**
	 * Unwraps a json_decode return.
	 *
	 * @param array|object $any json_decode object.
	 * @return array|object
	 */
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
