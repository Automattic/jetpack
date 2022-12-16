<?php
/**
 * Revue Block.
 *
 * @since 8.3.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Revue;

use Automattic\Jetpack\Blocks;

const FEATURE_NAME = 'revue';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

// @TODO Due to Revue being shut down as of 18th Jan 2023, this whole block should be removed a couple of months later.
/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Revue block render callback.
 *
 * @param array $attributes Array containing the Revue block attributes.
 *
 * @return string
 */
function render_block( $attributes ) {
	if ( current_user_can( 'manage_options' ) ) {
		$revue_url            = esc_url( 'http://help.getrevue.co/en/articles/6819675-we-ve-made-the-difficult-decision-to-shut-down-revue' );
		$wpcom_newsletter_url = esc_url( 'https://wordpress.com/support/launch-a-newsletter/#add-subscribers' );
		$message              = sprintf(
			'<br/>'
			/* Translators: %s contains the words 'shutting down', which links to a Revue help article about the feature being shut down. */
			. esc_html__( 'Revue is %1$s. The Revue signup form will no longer be displayed to your visitors and as such this block should be removed. %2$s You can move your newsletter to WordPress.com - migrate your subscribers %3$s.', 'jetpack' ),
			sprintf(
				'<a href="%1$s" target="_blank">%2$s</a>',
				$revue_url,
				esc_html__( 'shutting down', 'jetpack' )
			),
			'<br/> <br/>',
			sprintf(
				'<a href="%1$s" target="_blank">%2$s</a>',
				$wpcom_newsletter_url,
				esc_html__( 'by following these steps', 'jetpack' )
			)
		);
		return sprintf(
			'<div class="jetpack-block__notice info %1$s" style="border-left:5px solid #dba617;padding:1em;background-color:#f8f9f9;">%2$s</div>',
			esc_attr( Blocks::classes( FEATURE_NAME, $attributes ) ),
			$message
		);
	}
}
