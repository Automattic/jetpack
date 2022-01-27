<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS\Cloud_CSS_Request;
use Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS\Cloud_CSS_State;
use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\REST_API\Contracts;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;
use Automattic\Jetpack_Boost\REST_API\Permissions\Nonce;
use WP_REST_Server;

class Generate_Cloud_CSS implements Contracts\Endpoint
{

    public function name()
    {
		return 'cloud-css/request-generate';
    }

    public function request_methods()
    {
        return WP_REST_Server::CREATABLE;
    }

    public function response($request)
    {
		$client = new Cloud_CSS_Request();
		return $client->request_generate();
    }

    public function permissions()
    {
		return [
			new Current_User_Admin(),
		];
    }
}
