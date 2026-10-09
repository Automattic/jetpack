<?php
/**
 * Sharing Buttons Block.
 *
 * @since 13.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Sharing_Button_Block;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/class-sharing-source-block.php';
require_once __DIR__ . '/components/social-icons.php';

const PARENT_BLOCK_NAME = 'jetpack/sharing-buttons';
const INNER_BLOCK_NAME  = 'jetpack/sharing-button';

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
 * @param object $block   Object containing block data.
 *
 * @return string
 */
function render_block( $attr, $content, $block ) {
	$services = get_services();
	if ( ! isset( $attr['service'] ) || ! array_key_exists( $attr['service'], $services ) ) {
		return $content;
	}

	$service_name = $attr['service'];
	$title        = $attr['label'] ?? $service_name;
	$icon         = get_social_logo( $service_name );
	$style_type   = $block->context['styleType'] ?? 'icon-text';
	$post_id      = $block->context['postId'] ?? 0;
	$data_shared  = sprintf(
		'sharing-%1$s-%2$d',
		$service_name,
		$post_id
	);

	$service      = new $services[ $service_name ]( $service_name, array() );
	$link_props   = $service->get_link(
		$post_id,
		'share=' . esc_attr( $service_name ) . '&nb=1',
		esc_attr( $data_shared )
	);
	$link_url     = $link_props['url'];
	$link_classes = sprintf(
		'jetpack-sharing-button__button style-%1$s share-%2$s',
		$style_type,
		$service_name
	);

	$accessible_name = sprintf(
		/* translators: %s refers to a string representation of sharing service, e.g. Facebook */
		esc_html__( 'Share on %s', 'jetpack' ),
		esc_html( $title )
	);

	$accessible_name .= __( ' (Opens in new window)', 'jetpack' );

	$block_class_name = 'jetpack-sharing-button__list-item';

	if ( $service_name === 'share' ) {
		$block_class_name .= ' tooltip';
		/* translators: aria label for SMS sharing button */
		$accessible_name = esc_attr__( 'Share using Native tools', 'jetpack' );
		$link_props      = $service->get_link( $post_id );
	}

	$link_url     = $link_props['url'];
	$link_classes = sprintf(
		'jetpack-sharing-button__button style-%1$s share-%2$s',
		$style_type,
		$service_name
	);

	$styles = array();
	if (
		array_key_exists( 'iconColorValue', $block->context )
		&& ! empty( $block->context['iconColorValue'] )
	) {
		$styles['color'] = $block->context['iconColorValue'];
	}
	if (
		array_key_exists( 'iconBackgroundColorValue', $block->context )
		&& ! empty( $block->context['iconBackgroundColorValue'] )
	) {
		$styles['background-color'] = $block->context['iconBackgroundColorValue'];
	}
	$link_styles = '';
	foreach ( $styles as $property => $value ) {
		$link_styles .= $property . ':' . $value . ';';
	}

	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$component  = '<li class="' . esc_attr( $block_class_name ) . '">';
	$component .= sprintf(
		'<a href="%1$s" target="_blank" rel="nofollow noopener noreferrer" class="%2$s" style="%3$s" data-service="%4$s" data-shared="%5$s" aria-labelledby="%5$s">',
		esc_url( $link_url ),
		esc_attr( $link_classes ),
		esc_attr( $link_styles ),
		esc_attr( $service_name ),
		esc_attr( $data_shared )
	);

	// Add hidden span with accessible name
	$component .= sprintf(
		'<span id="%s" hidden>%s</span>',
		esc_attr( $data_shared ),
		esc_html( $accessible_name )
	);

	$component .= $style_type !== 'text' ? $icon : '';
	$component .= '<span class="jetpack-sharing-button__service-label" aria-hidden="true">' . esc_html( $title ) . '</span>';
	if ( $service_name === 'share' ) {
		$component .= '<span class="tooltiptext" aria-live="assertive">' . esc_html__( 'Copied to clipboard', 'jetpack' ) . '</span>';
	}
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
		'telegram'  => Share_Telegram_Block::class,
		'threads'   => Share_Threads_Block::class,
		'whatsapp'  => Jetpack_Share_WhatsApp_Block::class,
		'mastodon'  => Share_Mastodon_Block::class,
		'nextdoor'  => Share_Nextdoor_Block::class,
		'bluesky'   => Share_Bluesky_Block::class,
		'x'         => Share_X_Block::class,
		'share'     => Share_Native_Block::class,
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

		// Only allow services that have been defined in get_services().
		if ( ! array_key_exists( $service_name, $services ) ) {
			return;
		}

		$service = new $services[ ( $service_name ) ]( $service_name, array() );
		$service->process_request( $post, $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
	}
}

// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only checking for the data being present.
if ( isset( $_GET['share'] ) ) {
	add_action( 'template_redirect', __NAMESPACE__ . '\sharing_process_requests', 9 );
}
