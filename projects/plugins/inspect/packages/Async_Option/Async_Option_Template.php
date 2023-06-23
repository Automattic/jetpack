<?php

namespace Automattic\Jetpack\Packages\Async_Option;

use Automattic\Jetpack\Packages\Async_Option\Storage\Storage;
use Automattic\Jetpack\Packages\Async_Option\Storage\WP_Option;

/**
 * Any registered async option should use this async option template
 * and extend the methods that are necessary.
 */
abstract class Async_Option_Template {

	/**
	 * The default value if no option is found.
	 */
	public static $DEFAULT_VALUE = false;

	/**
	 * @var string[]
	 */
	private $errors = [];

	/**
	 * Setup storage mechanism that subscribes to `Storage` contract
	 *
	 * @param $storage_namespace string
	 *
	 * @return Storage
	 *
	 */
	public function setup_storage( $storage_namespace ) {
		return new WP_Option( $storage_namespace );
	}

	/**
	 * On get,
	 * Transform the value when it's retrieved from storage.
	 *
	 * @param $value
	 *
	 * @return mixed
	 */
	public function transform( $value ) {
		return $value;
	}

	/**
	 * 1) On submit,
	 * Parse the received value before it's validated.
	 *
	 * This can be used for things like json_decode or casting types.
	 *
	 * @param $value
	 *
	 * @return mixed
	 */
	public function parse( $value ) {
		return $value;
	}

	/**
	 * 2) On submit,
	 * Validate a received value before storing it.
	 *
	 * Use this method to provide feedback if the value isn't valid.
	 * Using `$this->add_error()` will prevent the value from being stored.
	 *
	 * @param $value
	 *
	 * @return bool - Return true on success, false on failure.
	 */
	public function validate( $value ) {
		return ! $this->has_errors();
	}

	/**
	 * 3) On submit,
	 * Sanitize the value before inserting it into storage.
	 *
	 * This is the only required method of any async option
	 * because values shouldn't be stored unsanitized.
	 * Wash your values, friends.
	 *
	 * @param $value
	 *
	 * @return mixed
	 */
	abstract function sanitize( $value );



	/**
	 *
	 *  Methods to help handling errors
	 *
	 */
	public function has_errors() {
		return ! empty( $this->errors );
	}

	public function get_errors() {
		return implode( "\n", $this->errors );
	}

	protected function add_error( $message ) {
		$this->errors[] = $message;
	}
}
