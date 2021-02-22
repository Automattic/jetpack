<?php
/**
 * Anchor.fm integration.
 *
 * @since 9.3.0
 *
 * @package automattic/jetpack
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
	if (
		$current_screen instanceof \WP_Screen
		&& ! $current_screen->is_block_editor()
	) {
		// Return early if we are not in the block editor.
		return;
	}

	$post = get_post();
	if ( ! $post || ! $post->ID ) {
		return;
	}

	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	$podcast_id  = isset( $_GET['anchor_podcast'] ) ? sanitize_text_field( wp_unslash( $_GET['anchor_podcast'] ) ) : null;
	$episode_id  = isset( $_GET['anchor_episode'] ) ? sanitize_text_field( wp_unslash( $_GET['anchor_episode'] ) ) : null;
	$spotify_url = isset( $_GET['spotify_url'] ) ? wp_unslash( $_GET['spotify_url'] ) : null;
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	$data = array(
		'actions' => array(),
	);

	// add / update Spotify Badge URL.
	$valid_spotify_url = \Jetpack_Gutenberg::validate_block_embed_url( $spotify_url, array( 'open.spotify.com' ) );
	if ( $valid_spotify_url ) {
		$data['spotifyShowUrl'] = $valid_spotify_url;
		if ( get_post_meta( $post->ID, 'jetpack_anchor_spotify_show', true ) !== $valid_spotify_url ) {
			update_post_meta( $post->ID, 'jetpack_anchor_spotify_show', $valid_spotify_url );
		}
	}

	if ( ! empty( $podcast_id ) ) {
		$feed           = 'https://anchor.fm/s/' . $podcast_id . '/podcast/rss';
		$podcast_helper = new Jetpack_Podcast_Helper( $feed );
		$rss            = $podcast_helper->load_feed();
		if ( ! \is_wp_error( $rss ) ) {
			update_post_meta( $post->ID, 'jetpack_anchor_podcast', $podcast_id );

			// If we haven't got an episode ID, try and get the latest episode.
			if ( empty( $episode_id ) && $rss->get_item_quantity() ) {
				$latest_episode = $rss->get_item( 0 );
				if ( $latest_episode ) {
					$episode_id = $latest_episode->get_id();
				}
			}

			if ( ! empty( $episode_id ) ) {
				$track = $podcast_helper->get_track_data( $episode_id, true );
				if ( ! \is_wp_error( $track ) ) {
					update_post_meta( $post->ID, 'jetpack_anchor_episode', $track['guid'] );

					if ( 'post-new.php' === $GLOBALS['pagenow'] ) {
						$data['actions'][] = array(
							'set-episode-title',
							array(
								'title' => $track['title'],
							),
						);

						$self_links = $rss->get_links( 'self' );
						$cover      = $rss->get_image_url();

						// Add insert basic template action.
						$data['actions'][] = array(
							'insert-episode-template',
							array(
								'feedUrl'         => ! empty( $self_links ) ? esc_url_raw( $self_links[0] ) : $feed,
								'coverImage'      => ! empty( $cover ) ? esc_url( $cover ) : null,
								'episodeTrack'    => $track,
								'spotifyImageUrl' => Assets::staticize_subdomain( 'https://wordpress.com/i/spotify-badge.svg' ),
								'spotifyShowUrl'  => esc_url_raw( $valid_spotify_url ),
							),
						);
						l( $track );
						if ( $track['publish_date'] && false !== strtotime( $track['publish_date'] ) ) {

							$date      = get_date_from_gmt( $track['publish_date'] );
							$gmt_date  = get_gmt_from_date( $track['publish_date'] );
							$post_data = array(
								'ID'                => $post->ID,
								'post_date'         => $date,
								'post_date_gmt'     => $gmt_date,
								'post_modified'     => $date,
								'post_modified_gmt' => $gmt_date,
							);

							// This is a bit of hack. There are various checks when updating a post
							// with draft or auto draft status, to make sure that the publish date is
							// kept to the current date and time. This registers a filter, so at the
							// last minute, we can override it. Should we be doing this?
							$override_post_date = function ( $data, $postarr ) use ( $post_data ) {
								l( $postarr );
								l( $post_data );
								if ( $postarr['ID'] === $post_data['ID'] ) {
									return array_merge( $data, $post_data );
								}
								return $data;
							};

							add_filter( 'wp_insert_post_data', $override_post_date, 10, 2 );
							wp_update_post( $post_data );
							remove_filter( 'wp_insert_post_data', $override_post_date, 10, 2 );
						}
					}
				} else {
					$retry_url         = add_query_arg(
						array(
							'anchor_episode' => $episode_id,
							'anchor_podcast' => $podcast_id,
							'spotify_url'    => $valid_spotify_url ? rawurlencode( $spotify_url ) : false,
						),
						admin_url( 'post-new.php' )
					);
					$data['actions'][] = array(
						'create-episode-error-notice',
						array(
							'retry_url' => esc_url_raw( $retry_url ),
						),
					);
				}
			}
		}
	}

	// Add Spotify Badge template action.
	if (
		$valid_spotify_url && (
			'post-new.php' !== $GLOBALS['pagenow'] // Delegate badge insertion to podcast template.
		)
	) {
		$data['actions'][] = array(
			'insert-spotify-badge',
			array(
				'spotifyImageUrl' => Assets::staticize_subdomain( 'https://wordpress.com/i/spotify-badge.svg' ),
				'spotifyShowUrl'  => esc_url_raw( $valid_spotify_url ),
			),
		);
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
