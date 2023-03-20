<?php
namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;
interface Validation_Type {
	public function validate($array);
	public function sanitize($data);
}
