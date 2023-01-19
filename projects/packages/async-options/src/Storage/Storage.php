<?php

namespace Automattic\Jetpack\Async_Options\Storage;

interface Storage {

	public function get( $key );

	public function set( $key, $value );

	public function delete( $key );
}
