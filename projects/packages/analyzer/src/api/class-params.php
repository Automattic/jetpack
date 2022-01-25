<?php
namespace Automattic\Jetpack\Analyzer;

/**
 * Params class
 */
class Params {
	public function get_params() {
		parse_str($_SERVER['QUERY_STRING'], $params);
		return $params;
	}

	public function get_param( $param ) {
		$params = $this->get_params();
		if( array_key_exists( $param, $params ) ) {
			return $params[$param];
		}
		return false;
	}
}
