<?php
/**
 * Blogroll Block.
 *
 * @since 12.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Blogroll;

require_once __DIR__ . '/blogroll-item/blogroll-item.php';

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_callback'  => __NAMESPACE__ . '\load_assets',
			'provides_context' => array(
				'openLinksNewWindow' => 'open_links_new_window',
			),
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Blogroll block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Blogroll block attributes.
 * @param string $content String containing the Blogroll block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	global $wp;

	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );
	$current_location = home_url( $wp->request );
	$is_wpcom         = ( defined( 'IS_WPCOM' ) && IS_WPCOM );

	$form_content = <<<HTML
		<form method="post" action="https://subscribe.wordpress.com" accept-charset="utf-8">
			<input name="action" type="hidden" value="subscribe">
			<input name="source" type="hidden" value="$current_location">
			<input name="sub-type" type="hidden" value="jetpack_blogroll">
			$content
		</form>
HTML;

	$blogroll_content = $is_wpcom && jetpack_is_frontend() ? $form_content : $content;

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$blogroll_content
	);
}

/**
 * Register site_recommendations settings
 *
 * @since 12.7
 */
function site_recommendations_settings() {
	register_setting(
		'general',
		'Blogroll Recommendations', // Visible to the user see: https://github.com/WordPress/gutenberg/issues/41637
		array(
			'description'   => __( 'Site Recommendations', 'jetpack' ),
			'type'          => 'array',
			'show_in_rest'  => array(
				'schema' => array(
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'                => array(
								'type'   => 'string',
								'format' => 'text-field',
							),
							'name'              => array(
								'type'   => 'string',
								'format' => 'text-field',
							),
							'icon'              => array(
								'type'   => 'string',
								'format' => 'uri',
							),
							'url'               => array(
								'type'   => 'string',
								'format' => 'uri',
							),
							'description'       => array(
								'type'   => 'string',
								'format' => 'text-field',
							),
							'is_non_wpcom_site' => array(
								'type' => 'boolean',
							),
						),
					),
				),
			),
			'auth_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
		)
	);
}

add_action( 'rest_api_init', __NAMESPACE__ . '\site_recommendations_settings' );
