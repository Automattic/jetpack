<?php

class Jetpack_JSON_API_Modules_Get_Endpoint extends Jetpack_JSON_API_Modules_Endpoint {
	// GET  /sites/%s/jetpack/modules/%s
	protected $needed_capabilities = 'jetpack_manage_modules';
}
