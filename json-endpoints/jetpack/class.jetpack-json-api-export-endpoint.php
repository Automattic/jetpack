<?php

// POST /sites/%s/export
class Jetpack_JSON_API_Export_Endpoint extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'export';

	protected function validate_call( $_blog_id, $capability, $check_manage_active = true ) {
		parent::validate_call( $_blog_id, $capability, false );
	}

	protected function result() {

		$args = $this->input();

		// TODO: Add logic for exporting site content.

		return array(
			'status'        => 'success',
			'download_url'  => 'uploads/2016/11/21/export.zip'
		);
	}
}
