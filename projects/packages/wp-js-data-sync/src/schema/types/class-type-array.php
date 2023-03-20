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
			if (!$this->sub_schema->validate($item)) {
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
			$sanitized_data[$key] = $this->sub_schema->sanitize($value);
		}
		return $sanitized_data;
	}
}
