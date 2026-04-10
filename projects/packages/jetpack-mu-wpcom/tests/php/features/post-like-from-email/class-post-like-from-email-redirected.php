<?php
/**
 * Post Like From Email test support: exception thrown by the wp_redirect filter so
 * tests can assert on the redirect target without reaching exit;
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

/**
 * Thrown from a wp_redirect filter to escape wpcom_handle_post_like_from_email()
 * before its exit; runs. The intended redirect target is available via getMessage().
 */
class Post_Like_From_Email_Redirected extends \Exception {}
