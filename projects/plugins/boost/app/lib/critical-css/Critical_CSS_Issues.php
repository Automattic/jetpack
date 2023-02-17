<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry_Handler;
use Automattic\Jetpack\WP_JS_Data_Sync\Storage_Drivers\Storage_Driver;


class Refactoring_Critical_CSS_State_Storage implements Storage_Driver {


	public function __construct( $namespace ) {
		$this->namespace = $namespace;
		$this->generator = new \Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Generator();
	}

	public function get( $key ) {
		return $this->generator->get_issues();
	}

	public function set( $key, $issues ) {
		foreach ( $issues as $issue ) {
			$provider_key = $issue['provider_key'];
			$issue_status = $issue['status'];
			$this->generator->state->set_provider_issue_status( $provider_key, $issue_status );
		}
	}

	public function delete( $key ) {
		// TODO: Implement delete() method.
	}
}

class Critical_CSS_Issues extends Data_Sync_Entry_Handler {

	public function setup_storage( $storage_namespace ) {
		return new Refactoring_Critical_CSS_State_Storage( $storage_namespace );
	}

	public function parse( $value ) {
		return $value;
	}

	public function validate( $value ) {
		return true;
	}

	public function sanitize( $value ) {
		return $value;
	}

	public function transform( $value ) {
		return $value;
	}
}
