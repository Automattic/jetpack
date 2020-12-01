<?php
/**
 * Anchor.fm integration.
 *
 * @since 9.0.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\AnchorFm;

use Automattic\Jetpack\Blocks;
use Jetpack_Podcast_Helper;

const FEATURE_NAME = 'anchor-fm';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers Anchor.fm integration for the block editor.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array(
			'plan_check' => false,
		)
	);

	// Register post_meta for connecting episodes with posts.
	register_post_meta(
		'post',
		'anchor_episode',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);
	register_post_meta(
		'post',
		'anchor_podcast',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);
}

/**
 * Checks URL params to determine if we are supposed to insert a badge.
 */
function check_badge_insertion() {
	$current_screen = \get_current_screen();
	// TODO: Replace `$current_screen->is_block_editor()` with `wp_should_load_block_editor_scripts_and_styles()` that is introduced in WP 5.6.
	if ( method_exists( $current_screen, 'is_block_editor' ) && ! $current_screen->is_block_editor() ) {
		// Return early if we are not in the block editor.
		return;
	}

	// Try loading podcast track.
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$podcast_id = $_GET['anchor_podcast'];
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$episode_id = $_GET['anchor_episode'];

	if ( empty( $podcast_id ) || empty( $episode_id ) ) {
		// No data.
		return;
	}

	$feed  = 'https://anchor.fm/s/' . $podcast_id . '/podcast/rss';
	$track = Jetpack_Podcast_Helper::get_track_data( $feed, $episode_id );

	if ( empty( $track ) || \is_wp_error( $track ) ) {
		// Nothing useful found.
		return;
	}

	// Make episode data available for the script.
	wp_localize_script(
		'jetpack-blocks-editor',
		'Jetpack_AnchorFm',
		array(
			'track'      => $track,
			'podcast_id' => $podcast_id,
			'episode_id' => $episode_id,
		)
	);
}

add_action( 'init', __NAMESPACE__ . '\register_block' );
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\check_badge_insertion' );
