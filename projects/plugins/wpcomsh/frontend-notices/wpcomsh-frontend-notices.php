<?php
/**
 * Frontend Notices.
 *
 * @package frontend notice.
 */

/**
 * Loads frontend notice.
 */
require_once __DIR__ . '/class-wpcomsh-frontend-notices.php';

add_action( 'wp_enqueue_scripts', array( 'WPCOMSH_Frontend_Notices', 'action_wp_enqueue_script' ) );

// Load the gifting banner. add_action is at the bottom of the file, this makes it easy to copy to WPCOM.
require_once __DIR__ . '/gifting-banner/gifting-banner.php';
