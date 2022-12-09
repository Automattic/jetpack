<?php

namespace Automattic\Jetpack_Inspect\Async_Option\Contracts;

interface Storage {

	public function get( $key );

	public function set( $key, $value );

	public function delete( $key );
}
