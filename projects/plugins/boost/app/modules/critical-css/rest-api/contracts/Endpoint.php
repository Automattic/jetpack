<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Contracts;

interface Endpoint {

	public function name();

	public function request_methods();

	public function response( $request );

	public function permissions();

}
