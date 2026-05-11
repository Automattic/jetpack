<?php
/**
 * Bootstrap.
 *
 * Shadows the wpcom Simple `tracks_record_event` from wpcom-stubs at test
 * runtime so dispatched events land in a per-test buffer.
 *
 * @phan-file-suppress PhanRedefineFunction
 *
 * @package automattic/jetpack-podcast
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

\Automattic\Jetpack\Test_Environment::init();

if ( ! function_exists( 'tracks_record_event' ) ) {
	function tracks_record_event( $user, $event_name, $properties = array() ) {
		$GLOBALS['jetpack_podcast_test_captured_events'][] = array(
			'user'       => $user,
			'event_name' => $event_name,
			'properties' => $properties,
		);
		return true;
	}
}

/**
 * Mirror the jetpack-mu-wpcom sticker dispatcher.
 */
if ( ! function_exists( 'wpcom_has_blog_sticker' ) ) {
	function wpcom_has_blog_sticker( $sticker, $blog_id ) {
		$stickers = $GLOBALS['jetpack_podcast_test_stickers'][ $blog_id ] ?? array();
		return in_array( $sticker, $stickers, true );
	}
}
