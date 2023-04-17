<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Contracts;

interface Data_Sync_Entry_Adapter {
	public function can( $method );

	public function get();

	public function set( $value );

	public function merge( $partial_value );

	public function delete();

}
