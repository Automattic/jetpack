<?php

require_once dirname( __FILE__ ) . '/class.wpcom-jetpack-mapper-base.php';

/**
 * WP.com <-> Jetpack endpoint mapping logic for endpoints that do not require
 * any special handling.  This is intended for use with endpoints that also
 * ship with Jetpack.
 */
class WPCOM_Jetpack_Mapper_Passthrough extends WPCOM_Jetpack_Mapper_Base {
	/** This method is documented in class.wpcom-jetpack-mapper-base.php */
	public function map_request_to_jetpack( $request ) {
		return $request;
	}

	/** This method is documented in class.wpcom-jetpack-mapper-base.php */
	public function map_response_data_to_wpcom( $data, $request ) {
		return $data;
	}
}
