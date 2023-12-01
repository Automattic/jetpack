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

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-sources-block.php';

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
	$post_id = $block->context['postId'];

	$style_type  = $block->context['styleType'];
	$style       = 'style-' . $style_type;
	$data_shared = 'sharing-' . $attr['service'] . '-' . $post_id . $attr['service'];
	$link_url    = get_permalink( $post_id ) . '?share=' . $attr['service'] . '&nb=1';

	$content = str_replace( 'url_replaced_in_runtime', $link_url, $content );
	$content = str_replace( 'style_button_replace_at_runtime', $style, $content );
	$content = str_replace( 'data-shared_replaced_in_runtime', $data_shared, $content );
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );
	return $content;
}

/**
 * Get services for the Sharing Buttons block.
 *
 * @return array Array of services.
 */
function get_services() {
	$services = array(
		'print'            => 'Share_Print_Beta',
		'email'            => 'Share_Email_Beta',
		'facebook'         => 'Share_Facebook_Beta',
		'linkedin'         => 'Share_LinkedIn_Beta',
		'reddit'           => 'Share_Reddit_Beta',
		'twitter'          => 'Share_Twitter_Beta',
		'tumblr'           => 'Share_Tumblr_Beta',
		'pinterest'        => 'Share_Pinterest_Beta',
		'pocket'           => 'Share_Pocket_Beta',
		'telegram'         => 'Share_Telegram_Beta',
		'jetpack-whatsapp' => 'Jetpack_Share_WhatsApp_Beta',
		'mastodon'         => 'Share_Mastodon_Beta',
		'nextdoor'         => 'Share_Nextdoor_Beta',
		'x'                => 'Share_X_Beta',
		// deprecated.
		'skype'            => 'Share_Facebook_Beta',
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

	$services = get_services();

	// Only process if: single post and share=X defined
	if ( ( is_page() || is_single() ) && isset( $_GET['share'] ) && is_string( $_GET['share'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$service_name = sanitize_text_field( wp_unslash( $_GET['share'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$service      = new $services[ ( $service_name ) ]( $service_name, array() ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( $service ) {
			$service->process_request( $post, $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		}
	}
}

add_action( 'template_redirect', __NAMESPACE__ . '\sharing_process_requests', 9 );
