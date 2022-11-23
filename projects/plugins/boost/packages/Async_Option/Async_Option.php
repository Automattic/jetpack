<?php

namespace Automattic\Jetpack\Packages\Async_Option;

use Automattic\Jetpack\Packages\Async_Option\Storage\Storage;

class Async_Option {

	/**
	 * @var string
	 */
	private $key;

	/**
	 * @var Storage
	 */
	protected $storage;

	/**
	 * @var Async_Option_Template
	 */
	protected $option;

	/**
	 * @param $namespace string
	 * @param $key       string
	 * @param $option     Async_Option_Template
	 */
	public function __construct( $namespace, $key, $option ) {
		$this->key     = $key;
		$this->option  = $option;
		$this->storage = $this->option->setup_storage( $namespace );
	}

	public function get() {
		// php 5.6 compatibility - Dealing with unexpected '::' (T_PAAMAYIM_NEKUDOTAYIM)
		$option = $this->option;

		return $this->option->transform(
			$this->storage->get( $this->key, $option::get_default_value() )
		);
	}

	public function set( $input ) {

		$value = $this->option->parse( $input );

		if ( true !== $this->option->validate( $value ) ) {
			return $this->option->get_errors();
		}

		if ( ! empty( $this->storage ) ) {
			return $this->storage->set( $this->key, $this->option->sanitize( $value ) );
		}

		return false;
	}

	public function delete() {
		return $this->storage->delete( $this->key );
	}

	public function key() {
		return $this->key;
	}

	public function has_errors() {
		return $this->option->has_errors();
	}

	public function get_errors() {
		return $this->option->get_errors();
	}

}
