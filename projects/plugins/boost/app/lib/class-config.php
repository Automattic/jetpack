<?php

namespace Automattic\Jetpack_Boost\Lib;

class Config {
	/**
	 * The option name to store this config in.
	 *
	 * @var string $option_name The option name.
	 */
	private $option_name;

	/**
	 * @param string $option_name
	 */
	public function __construct( $option_name ) {
		$this->option_name = $option_name;
	}

	protected function get_options() {
		$value = get_option( $this->option_name, array() );
		if ( ! is_array( $value ) ) {
			return array();
		}
		return $value;
	}

	protected function update_option( $value ) {
		return update_option( $this->option_name, $value, true );
	}

	public function get( $key ) {
		$options = $this->get_options();
		if ( ! isset( $options[ $key ] ) ) {
			return;
		}
		return $options[ $key ];
	}

	public function update( $key, $value ) {
		$options         = $this->get_options();
		$options[ $key ] = $value;
		$this->update_option( $options );

		return $options;
	}

}
