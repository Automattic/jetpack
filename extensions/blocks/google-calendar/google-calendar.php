<?php
/**
 * Google Calendar Block.
 *
 * @since 8.0.0
 *
 * @package Jetpack
 */

namespace Jetpack\Google_Calendar_Block;

const FEATURE_NAME = 'google-calendar';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;
/**
 * Check if the block should be available on the site.
 *
 * @return bool
 */
function is_available() {
	if (
		defined( 'IS_WPCOM' )
		&& IS_WPCOM
		&& function_exists( 'has_any_blog_stickers' )
	) {
		if ( has_any_blog_stickers(
			array( 'premium-plan', 'business-plan', 'ecommerce-plan' ),
			get_current_blog_id()
		) ) {
			return true;
		}
		return false;
	}

	return true;
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if ( is_available() ) {
		jetpack_register_block(
			BLOCK_NAME,
			array(
				'render_callback'      => 'Jetpack\Google_Calendar_Block\load_assets',
				'version_requirements' => array(
					'wp'     => '5.4',
					'plugin' => '7.2',
				),
			)
		);
	}
}
add_action( 'init', 'Jetpack\Google_Calendar_Block\register_block' );

/**
 * Set the availability of the block as the editor
 * is loaded
 */
function set_availability() {
	if ( is_available() ) {
		\Jetpack_Gutenberg::set_extension_available( BLOCK_NAME );
	} else {
		\Jetpack_Gutenberg::set_extension_unavailable(
			BLOCK_NAME,
			'missing_plan',
			array(
				'required_feature' => 'google_calendar',
				'required_plan'    => 'value_bundle',
			)
		);
	}
}
add_action( 'init', 'Jetpack\Google_Calendar_Block\set_availability' );

/**
 * Google Calendar block registration/dependency declaration.
 *
 * @param array $attr Array containing the Google Calendar block attributes.
 * @return string
 */
function load_assets( $attr ) {
	$width  = isset( $attr['width'] ) ? $attr['width'] : '800';
	$height = isset( $attr['height'] ) ? $attr['height'] : '600';
	$url    = isset( $attr['url'] ) ? $attr['url'] : '';
	$align  = isset( $attr['align'] ) ? 'align' . $attr['align'] : '';

	if ( empty( $url ) ) {
		return;
	}

	if ( class_exists( 'Jetpack_AMP_Support' ) && \Jetpack_AMP_Support::is_amp_request() ) {
		return <<<EOT
<div class="wp-block-jetpack-google-calendar ${align}">
	<amp-iframe src="${url}" frameborder="0" style="border:0" scrolling="no" width="${width}" height="${height}" sandbox="allow-scripts allow-same-origin" layout="responsive"></amp-iframe>
</div>
EOT;
	} else {
		return <<<EOT
<div class="wp-block-jetpack-google-calendar ${align}">
	<iframe src="${url}" frameborder="0" style="border:0" scrolling="no" width="${width}" height="${height}"></iframe>
</div>
EOT;
	}
}
