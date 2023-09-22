<?php
/**
 * User Content Link Redirection on WPCOM
 *
 * The purpose of this file is to track user generated link clicks on the emails and redirect them to the original URL.
 * This is done by generating an iframe pointing to the track and redirect logic in .com.
 *
 * @package automattic/jetpack
 */

define( 'WPCOM_USER_CONTENT_LINK_REDIRECTION', true );

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions/jetpack-user-content-link-redirection.php';
