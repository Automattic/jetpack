<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

class Page_Cache_Diagnostic {

	public static function get_status() {
		$status = array();

		$checks = array(
			'canBeEnabled' => Health_Check::can_feature_be_enabled(),
		);

		foreach ( $checks as $check => $data ) {
			$is_error = is_wp_error( $data );

			$status[ $check ] = array(
				'status'  => ! $is_error,
				'error'   => $is_error ? $data->get_error_code() : '',
				'message' => $is_error ? $data->get_error_message() : '',
			);
		}

		return $status;
	}
}
