<?php

class Jetpack_JSON_API_Plugins_Get_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// GET  /sites/%s/plugins/%s
	protected $needed_capabilities = 'activate_plugins';
}
