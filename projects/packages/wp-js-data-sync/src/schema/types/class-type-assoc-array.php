<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Validation_Type;

class Type_Assoc_Array implements Validation_Type {
	private $sub_schema;

	public function __construct($sub_schema) {
		$this->sub_schema = $sub_schema;
	}

	public function validate($data) {
		if (!is_array($data) || $this->is_sequential_array($data)) {
			return false;
		}

		foreach ($this->sub_schema as $key => $validator) {
			if (!isset($data[$key]) || !$validator->validate($data[$key])) {
				return false;
			}
		}

		return true;
	}

	public function sanitize($data) {
		if (!is_array($data) || $this->is_sequential_array($data)) {
			return [];
		}

		$sanitized_data = [];
		foreach ($this->sub_schema as $key => $validator) {
			$sanitized_data[$key] = isset($data[$key]) ? $validator->sanitize($data[$key]) : null;
		}

		return $sanitized_data;
	}

	private function is_sequential_array($arr) {
		if (array() === $arr) {
			return false;
		}
		return array_keys($arr) === range(0, count($arr) - 1);
	}
}


