<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use PHPUnit\Framework\TestCase;

class Type_Assoc_Array_Test extends TestCase
{
	public function test_valid_assoc_array()
	{
		$assoc_schema = Schema::as_assoc_array(
			[
				'key1' => Schema::as_string(),
				'key2' => Schema::as_number()
			]
		);

		$valid_assoc_array = [
			'key1' => 'test',
			'key2' => 42
		];

		$this->assertTrue($assoc_schema->validate($valid_assoc_array));
	}

	public function test_invalid_assoc_array()
	{
		$assoc_schema = Schema::as_assoc_array(
			[
				'key1' => Schema::as_string(),
				'key2' => Schema::as_number()
			]
		);

		$invalid_assoc_array = [
			'key1' => 'test',
			'key2' => 'not a number'
		];

		$this->assertFalse($assoc_schema->validate($invalid_assoc_array));
	}

	public function test_sanitize_assoc_array()
	{
		$assoc_schema = Schema::as_assoc_array(
			[
				'key1' => Schema::as_string(),
				'key2' => Schema::as_number()
			]
		);

		$input_assoc_array = [
			'key1' => 'test',
			'key2' => 'not a number'
		];

		$sanitized_assoc_array = $assoc_schema->sanitize($input_assoc_array);

		$expected_sanitized_assoc_array = [
			'key1' => 'test',
			'key2' => 0
		];

		$this->assertEquals($expected_sanitized_assoc_array, $sanitized_assoc_array);
	}
}
