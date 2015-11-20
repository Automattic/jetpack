<?php

class Jetpack_JSON_API_Jetpack_Log_Endpoint extends Jetpack_JSON_API_Endpoint {
	// GET /sites/%s/jetpack-log
	protected $needed_capabilities = 'manage_options';

	protected function result() {
		$args = $this->input();
		$event = ( isset( $args['event'] ) && is_string( $args['event'] ) ) ? $code : false;
		$num  = ( isset( $args['num'] ) ) ? intval( $num ) : false;

		return array(
			'log' => Jetpack::get_log( $event, $num )
		);
	}
}
