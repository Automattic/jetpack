<?php
/**
 * Plugin Name: Social E2E config
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

/**
 * Define feature flags.
 *
 * @see https://github.com/Automattic/jetpack/blob/58853303c0175fb95823ad3b892295091324b8d6/projects/packages/publicize/src/class-publicize-script-data.php#L257-L272
 */
if ( ! defined( 'JETPACK_SOCIAL_HAS_ADMIN_PAGE' ) ) {
	define( 'JETPACK_SOCIAL_HAS_ADMIN_PAGE', true );
}
