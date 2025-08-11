<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Themes get endpoint class.
 *
 * GET  /sites/%s/themes/%s
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_JSON_API_Themes_Get_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {
	/**
	 * Needed capabilities.
	 *
	 * @var string
	 */
	protected $needed_capabilities = 'switch_themes';
}
