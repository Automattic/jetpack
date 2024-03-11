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
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

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

	/*
	 * Automatically add the sharing block to the end of single posts
	 * only when running WordPress 6.5 or later.
	 * @todo: remove when WordPress 6.5 is the minimum required version.
	 */
	global $wp_version;
	if ( version_compare( $wp_version, '6.5-beta2', '>=' ) ) {
		add_filter( 'hooked_block_types', __NAMESPACE__ . '\add_block_to_single_posts_template', 10, 4 );
		add_filter( 'hooked_block_' . PARENT_BLOCK_NAME, __NAMESPACE__ . '\add_default_services_to_block', 10, 5 );
	}
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

	$services = get_services();
	if ( ! array_key_exists( $service_name, $services ) ) {
		return $content;
	}

	$service         = new $services[ $service_name ]( $service_name, array() );
	$link_props      = $service->get_link(
		$post_id,
		'share=' . esc_attr( $service_name ) . '&nb=1',
		esc_attr( $data_shared )
	);
	$link_url        = $link_props['url'];
	$link_classes    = sprintf(
		'jetpack-sharing-button__button style-%1$s share-%2$s',
		$style_type,
		$service_name
	);
	$link_aria_label = sprintf(
		/* translators: %s refers to a string representation of sharing service, e.g. Facebook  */
		esc_html__( 'Share on %s', 'jetpack' ),
		esc_html( $title )
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

	$component  = '<li class="jetpack-sharing-button__list-item">';
	$component .= sprintf(
		'<a href="%1$s" target="_blank" rel="nofollow noopener noreferrer" class="%2$s" style="%3$s" data-service="%4$s" data-shared="%5$s" aria-label="%6$s">',
		esc_url( $link_url ),
		esc_attr( $link_classes ),
		esc_attr( $link_styles ),
		esc_attr( $service_name ),
		esc_attr( $data_shared ),
		esc_attr( $link_aria_label )
	);
	$component .= $style_type !== 'text' ? $icon : '';
	$component .= '<span class="jetpack-sharing-button__service-label" aria-hidden="true">' . esc_html( $title ) . '</span>';
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
		'threads'   => Share_Threads_Block::class,
		'whatsapp'  => Jetpack_Share_WhatsApp_Block::class,
		'mastodon'  => Share_Mastodon_Block::class,
		'nextdoor'  => Share_Nextdoor_Block::class,
		'bluesky'   => Share_Bluesky_Block::class,
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

		// Only allow services that have been defined in get_services().
		if ( ! array_key_exists( $service_name, $services ) ) {
			return;
		}

		$service = new $services[ ( $service_name ) ]( $service_name, array() ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( $service ) {
			$service->process_request( $post, $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		}
	}
}
add_action( 'template_redirect', __NAMESPACE__ . '\sharing_process_requests', 9 );

/**
 * Automatically add the Sharing Buttons block to the end of the Single Posts template.
 *
 * @since 13.2
 *
 * @param array                   $hooked_block_types The list of hooked block types.
 * @param string                  $relative_position  The relative position of the hooked blocks. Can be one of 'before', 'after', 'first_child', or 'last_child'.
 * @param string                  $anchor_block_type  The anchor block type.
 * @param WP_Block_Template|array $context            The block template, template part, or pattern that the anchor block belongs to.
 *
 * @return array
 */
function add_block_to_single_posts_template( $hooked_block_types, $relative_position, $anchor_block_type, $context ) {
	// Only automate the addition of the block in block-based themes.
	if ( ! wp_is_block_theme() ) {
		return $hooked_block_types;
	}

	// Proceed if the user has toggled the auto-addition in Jetpack settings.
	if ( ! get_option( 'jetpack_sharing_buttons_auto_add' ) ) {
		return $hooked_block_types;
	}

	/*
	 * The Sharing module must be disabled.
	 * We do not want to automatically insert sharing buttons twice.
	 * On WordPress.com Simple the module is always active so we must check differently.
	 * There, we check if buttons are enabled on single posts and pages.
	 */
	if ( ( new Host() )->is_wpcom_simple() ) {
		if ( ! class_exists( 'Sharing_Service' ) ) {
			include_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php';
		}

		$sharer = new \Sharing_Service();
		$global = $sharer->get_global_options();
		if (
			! $global['show']
			|| in_array( 'post', $global['show'], true )
			|| in_array( 'page', $global['show'], true )
		) {
			return $hooked_block_types;
		}
	} elseif ( ( new Modules() )->is_active( 'sharedaddy' ) ) {
		return $hooked_block_types;
	}

	// Only hook into page and single post templates.
	if (
		! $context instanceof \WP_Block_Template
		|| ! property_exists( $context, 'slug' )
		|| empty( $context->slug )
		|| ! preg_match( '/^(page|single)/', $context->slug )
	) {
		return $hooked_block_types;
	}

	$content = $context->content ?? '';
	// Check if the block is already in the template. If so, abort.
	if ( false !== strpos( $content, 'wp:' . PARENT_BLOCK_NAME ) ) {
		return $hooked_block_types;
	}

	// Add the block at the end of the post content.
	if (
		'after' === $relative_position
		&& 'core/post-content' === $anchor_block_type
	) {
		$hooked_block_types[] = PARENT_BLOCK_NAME;
	}

	return $hooked_block_types;
}

/**
 * Add default services to the block we add to the post content by default.
 *
 * @since 13.2
 *
 * @param array                   $parsed_hooked_block The parsed block array for the given hooked block type.
 * @param string                  $hooked_block_type   The hooked block type name.
 * @param string                  $relative_position   The relative position of the hooked block.
 * @param array                   $parsed_anchor_block The anchor block, in parsed block array format.
 * @param WP_Block_Template|array $context             The block template, template part, or pattern that the anchor block.
 *
 * @return array
 */
function add_default_services_to_block( $parsed_hooked_block, $hooked_block_type, $relative_position, $parsed_anchor_block, $context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	// Is the hooked block adjacent to the anchor block?
	if ( 'after' !== $relative_position ) {
		return $parsed_hooked_block;
	}

	// Use the icon style by default.
	$parsed_hooked_block['attrs']['styleType'] = 'icon';

	// Add default services (inner blocks) to the block.
	$parsed_hooked_block['innerBlocks'] = array(
		array(
			'blockName'    => INNER_BLOCK_NAME,
			'innerContent' => array(),
			'attrs'        => array(
				'service' => 'facebook',
				'label'   => esc_html__( 'Facebook', 'jetpack' ),
			),
		),
		array(
			'blockName'    => INNER_BLOCK_NAME,
			'innerContent' => array(),
			'attrs'        => array(
				'service' => 'x',
				'label'   => esc_html__( 'X', 'jetpack' ),
			),
		),
		array(
			'blockName'    => INNER_BLOCK_NAME,
			'innerContent' => array(),
			'attrs'        => array(
				'service' => 'mastodon',
				'label'   => esc_html__( 'Mastodon', 'jetpack' ),
			),
		),
	);

	// Wrap inner blocks in our sharing buttons markup.
	$parsed_hooked_block['innerContent'] = array(
		'<ul class="wp-block-jetpack-sharing-buttons has-normal-icon-size jetpack-sharing-buttons__services-list" id="jetpack-sharing-serivces-list">',
		null,
		null,
		null,
		'</ul>',
	);

	// Wrap the whole thing in a group block.
	return array(
		'blockName'    => 'core/group',
		'attrs'        => array(
			// Does the anchor block have a layout attribute? If so, use it in the group to maintain the same alignment.
			'layout' => $parsed_anchor_block['attrs']['layout'] ?? 'null',
		),
		'innerBlocks'  => array( $parsed_hooked_block ),
		'innerContent' => array(
			'<div class="wp-block-group">',
			null,
			'</div>',
		),
	);
}
