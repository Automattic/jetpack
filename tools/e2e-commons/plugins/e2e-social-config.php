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

// Define feature flags.
if ( ! defined( 'JETPACK_SOCIAL_HAS_ADMIN_PAGE' ) ) {
	define( 'JETPACK_SOCIAL_HAS_ADMIN_PAGE', true );
}
