<?php
/**
 * Sharing Buttons Block.
 *
 * @since 11.x
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Sharing_Button_Block;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

require_once __DIR__ . '/class-sharing-source-block.php';
require_once __DIR__ . '/components/social-icons.php';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Sharing Buttons block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Sharing Buttons block attributes.
 * @param string $content String containing the Sharing Buttons block content.
 * @param array  $block Array containing block data.
 *
 * @return string
 */
function render_block( $attr, $content, $block ) {
	global $post;
	$post_id = $block->context['postId'];
	$title   = $attr['label'] ?? $attr['service'];

	$style_type  = $block->context['styleType'];
	$style       = 'style-' . $style_type;
	$data_shared = 'sharing-' . $attr['service'] . '-' . $post_id . $attr['service'];
	$query       = 'share=' . $attr['service'] . '&nb=1';

	$services   = get_services();
	$service    = new $services[ $attr['service'] ]( $attr['service'], array() );
	$link_props = $service->get_link( $post, $query, $data_shared );
	$link_url   = $link_props['url'];

	$icon = get_social_logo( $attr['service'] );

	$sharing_link_class = 'jetpack-sharing-button__button ' . $style . ' share-' . $attr['service'];

	$link_aria_label = sprintf(
		/* translators: %s refers to a string representation of sharing service, e.g. Facebook  */
		esc_html__( 'Share on %s', 'jetpack' ),
		esc_html( $title )
	);

	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$component  = '<li class="jetpack-sharing-button__list-item">';
	$component .= '<a rel="nofollow noopener noreferrer" class="' . $sharing_link_class . '" href="' . $link_url . '" target="_blank" data-shared="' . $data_shared . '" aria-label="' . $link_aria_label . '" primary>';
	$component .= $icon;
	$component .= '<span class="jetpack-sharing-button__service-label" aria-hidden="true">' . $title . '</span>';
	$component .= '</a>';
	$component .= '</li>';

	return $component;
}

/**
 * Get services for the Sharing Buttons block.
 *
 * @return array Array of services.
 */
function get_services() {
	$services = array(
		'print'     => Share_Print_Block::class,
		'mail'      => Share_Email_Block::class,
		'facebook'  => Share_Facebook_Block::class,
		'linkedin'  => Share_LinkedIn_Block::class,
		'reddit'    => Share_Reddit_Block::class,
		'twitter'   => Share_Twitter_Block::class,
		'tumblr'    => Share_Tumblr_Block::class,
		'pinterest' => Share_Pinterest_Block::class,
		'pocket'    => Share_Pocket_Block::class,
		'telegram'  => Share_Telegram_Block::class,
		'whatsapp'  => Jetpack_Share_WhatsApp_Block::class,
		'mastodon'  => Share_Mastodon_Block::class,
		'nextdoor'  => Share_Nextdoor_Block::class,
		'x'         => Share_X_Block::class,
	);

	return $services;
}

/**
 * Launch sharing requests on page load when a specific query string is used.
 *
 * @return void
 */
function sharing_process_requests() {
	global $post;

	// Only process if: single post and share={service} defined
	if ( ( is_page() || is_single() ) && isset( $_GET['share'] ) && is_string( $_GET['share'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$services     = get_services();
		$service_name = sanitize_text_field( wp_unslash( $_GET['share'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$service      = new $services[ ( $service_name ) ]( $service_name, array() ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( $service ) {
			$service->process_request( $post, $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		}
	}
}

add_action( 'template_redirect', __NAMESPACE__ . '\sharing_process_requests', 9 );
