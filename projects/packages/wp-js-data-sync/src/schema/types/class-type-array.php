<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Validation_Type;

class Type_Array implements Validation_Type {
	private $sub_schema;

	public function __construct($sub_schema) {
		$this->sub_schema = $sub_schema;
	}

	public function validate($data) {
		if (!is_array($data)) {
			return false;
		}

		foreach ($data as $item) {
			if (is_array($this->sub_schema)) {
				foreach ($this->sub_schema as $key => $validator) {
					if (!isset($item[$key]) || !$validator->validate($item[$key])) {
						return false;
					}
				}
			} elseif (!$this->sub_schema->validate($item)) {
				return false;
			}
		}

		return true;
	}

	public function sanitize($data) {
		if (!is_array($data)) {
			return [];
		}

		$sanitized_data = [];
		foreach ($data as $key => $value) {
			if (is_array($this->sub_schema)) {
				$sanitized_item = [];
				foreach ($this->sub_schema as $k => $validator) {
					$sanitized_item[$k] = isset($value[$k]) ? $validator->sanitize($value[$k]) : null;
				}
				$sanitized_data[$key] = $sanitized_item;
			} else {
				$sanitized_data[$key] = $this->sub_schema->sanitize($value);
			}
		}
		return $sanitized_data;
	}
}

