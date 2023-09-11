<?php

namespace Automattic\Jetpack_Inspect\Options;

use Automattic\Jetpack\Packages\Async_Option\Async_Option_Template;

class Observer_Settings extends Async_Option_Template {

	// phpcs:ignore WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase
	public static $DEFAULT_VALUE = array(
		'enabled' => true,
		'filter'  => '',
	);

	public function sanitize( $value ) {
		return array(
			'enabled' => filter_var( $value['enabled'], FILTER_VALIDATE_BOOLEAN ),
			'filter'  => sanitize_text_field( $value['filter'] ),
		);
	}

	public function validate( $value ) {

		if ( ! isset( $value['enabled'] ) ) {
			$this->add_error( "Missing required key 'enabled'" );
		}
		if ( ! isset( $value['filter'] ) ) {
			$this->add_error( "Missing required key 'filters'" );
		}

		return ! $this->has_errors();
	}

	public function parse( $value ) {
		return json_decode( $value, ARRAY_A );
	}
}
