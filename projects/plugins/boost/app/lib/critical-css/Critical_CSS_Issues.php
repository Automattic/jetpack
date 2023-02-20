<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry_Handler;
use Automattic\Jetpack\WP_JS_Data_Sync\Storage_Drivers\Storage_Driver;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Provider;
use Automattic\Jetpack_Boost\Lib\Transient;

class Refactoring_Critical_CSS_State_Storage implements Storage_Driver {

	/**
	 * Given a provider key, find the provider which owns the key. Returns false
	 * if no Provider is found.
	 *
	 * @param string $provider_key Provider key.
	 *
	 * @return Provider|false|string
	 */
	public function find_provider_for( $provider_key ) {
		foreach ( $this->paths->get_providers() as $provider ) {
			if ( $provider::owns_key( $provider_key ) ) {
				return $provider;
			}
		}

		return false;
	}

	/**
	 * Returns a descriptive label for a provider key, or the raw provider key
	 * if none found.
	 *
	 * @param string $provider_key Provider key.
	 *
	 * @return mixed
	 */
	public function describe_provider_key( $provider_key ) {
		$provider = $this->find_provider_for( $provider_key );
		if ( ! $provider ) {
			return $provider_key;
		}

		/**
		 * Provider key.
		 *
		 * @param string $provider_key
		 */
		return $provider::describe_key( $provider_key );
	}

	public function __construct( $namespace ) {
		$this->namespace = $namespace;
		$this->paths     = new Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers();
	}

	public function get( $_unused ) {
		$data    = Transient::get( Critical_CSS_State::KEY_PREFIX . 'local' );
		$sources = $data['sources'];
		$issues  = array();
		foreach ( $sources as $key => $source ) {
			if ( empty( $source['error'] ) ) {
				continue;
			}

			$label = $this->describe_provider_key( $key );

			$errors = array();
			foreach ( $source['error'] as $url => $error ) {
				$errors[] = array_merge( $error, array( 'url' => $url ) );
			}

			$issues[] = array(
				'provider_name' => $label,
				'key'           => $key,
				'status'        => $source['issue_status'],
				'errors'        => $errors,
			);
		}

		return $issues;
	}

	public function set( $key, $issues ) {
		$data         = Transient::get( Critical_CSS_State::KEY_PREFIX . 'local' );
		$valid_statuses = array( 'dismissed', 'active' );
		foreach ( $issues as $issue ) {
			$provider_key = $issue['key'];
			$issue_status = $issue['status'];
			if ( in_array( $issue_status, $valid_statuses, true ) ) {
				$data['sources'][ $provider_key ]['issue_status'] = $issue_status;
			}
		}
		Transient::set( Critical_CSS_State::KEY_PREFIX . 'local', $data );
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
