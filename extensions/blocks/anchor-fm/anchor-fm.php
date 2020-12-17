<?php
/**
 * Anchor.fm integration.
 *
 * @since 9.3.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\AnchorFm;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;
use Jetpack_Podcast_Helper;

const FEATURE_NAME = 'anchor-fm';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

if ( ! class_exists( 'Jetpack_Podcast_Helper' ) ) {
	\jetpack_require_lib( 'class-jetpack-podcast-helper' );
}

/**
 * Registers Anchor.fm integration for the block editor.
 */
function register_extension() {
	Blocks::jetpack_register_block( BLOCK_NAME );

	// Register post_meta for connecting Anchor podcasts with posts.
	register_post_meta(
		'post',
		'jetpack_anchor_podcast',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);
	register_post_meta(
		'post',
		'jetpack_anchor_episode',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);
	register_post_meta(
		'post',
		'jetpack_anchor_spotify_show',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);
}

/**
 * Checks URL params to determine the Anchor integration action to perform.
 */
function process_anchor_params() {
	if (
		! function_exists( 'get_current_screen' )
		|| is_null( \get_current_screen() )
	) {
		return;
	}

	$current_screen = \get_current_screen();
	// TODO: Replace `$current_screen->is_block_editor()` with `wp_should_load_block_editor_scripts_and_styles()` that is introduced in WP 5.6.
	if ( method_exists( $current_screen, 'is_block_editor' ) && ! $current_screen->is_block_editor() ) {
		// Return early if we are not in the block editor.
		return;
	}

	$post = get_post();
	if ( ! $post || ! $post->ID ) {
		return;
	}

	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	$podcast_id       = isset( $_GET['anchor_podcast'] ) ? sanitize_text_field( wp_unslash( $_GET['anchor_podcast'] ) ) : null;
	$episode_id       = isset( $_GET['anchor_episode'] ) ? sanitize_text_field( wp_unslash( $_GET['anchor_episode'] ) ) : null;
	$spotify_show_url = isset( $_GET['spotify_show_url'] ) ? esc_url_raw( wp_unslash( $_GET['spotify_show_url'] ) ) : null;
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	$data = array(
		'actions' => array(),
	);

	if ( ! empty( $podcast_id ) ) {
		$feed           = 'https://anchor.fm/s/' . $podcast_id . '/podcast/rss';
		$podcast_helper = new Jetpack_Podcast_Helper( $feed );
		$rss            = $podcast_helper->load_feed();
		if ( ! \is_wp_error( $rss ) ) {
			update_post_meta( $post->ID, 'jetpack_anchor_podcast', $podcast_id );

			if ( ! empty( $episode_id ) ) {
				$track = $podcast_helper->get_track_data( $episode_id );
				if ( ! \is_wp_error( $track ) ) {
					update_post_meta( $post->ID, 'jetpack_anchor_episode', $episode_id );

					if ( 'post-new.php' === $GLOBALS['pagenow'] ) {
						$data['actions'][] = array(
							'set-episode-title',
							array(
								'title' => $track['title'],
							),
						);
					}
				}
			}
		}
	}

	if ( ! empty( $spotify_show_url ) ) {
		$data['spotifyShowUrl'] = $spotify_show_url;
		if ( get_post_meta( $post->ID, 'jetpack_anchor_spotify_show', true ) !== $spotify_show_url ) {
			update_post_meta( $post->ID, 'jetpack_anchor_spotify_show', $spotify_show_url );
			$data['actions'][] = array(
				'insert-spotify-badge',
				array(
					'image' => Assets::staticize_subdomain( 'https://wordpress.com/i/spotify-badge.svg' ),
					'url'   => $spotify_show_url,
				),
			);
		}
	}

	// Display an outbound link after publishing a post (only to English-speaking users since Anchor
	// is English only).
	if (
		'post' === get_post_type() &&
		! get_post_meta( $post->ID, 'jetpack_anchor_spotify_show', true ) &&
		0 === strpos( get_user_locale(), 'en' )
	) {
		$data['actions'][] = 'show-post-publish-outbound-link';
	}

	wp_localize_script( 'jetpack-blocks-editor', 'Jetpack_AnchorFm', $data );
}

add_action( 'init', __NAMESPACE__ . '\register_extension' );
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\process_anchor_params' );
