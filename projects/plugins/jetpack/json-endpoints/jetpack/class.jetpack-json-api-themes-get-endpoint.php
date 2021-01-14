<?php

class Jetpack_JSON_API_Themes_Get_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {
	// GET  /sites/%s/themes/%s
	protected $needed_capabilities = 'switch_themes';
}
