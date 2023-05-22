<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

class Utils {

	private $use_wp;

	public function __construct( $use_wp = true ) {
		$this->use_wp = $use_wp;
	}

	public function init_fs() {
		if ( ! $this->use_wp ) {
			return;
		}
	}

	public function json_encode( $value ) {
		if ( $this->use_wp ) {
			return wp_json_encode( $value );
		}

		return json_encode( $value );
	}

	public function unslash( $value ) {
		if ( $this->use_wp ) {
			return wp_unslash( $value );
		}

		return is_string( $value ) ? stripslashes( $value ) : $value;
	}

	public function parse_url( $url, $component = -1 ) {
		if ( $this->use_wp ) {
			return wp_parse_url( $url, $component );
		}

		return parse_url( $url, $component );
	}
}
