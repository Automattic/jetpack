<?php
/**
 * Editor Notes Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Editor_Notes;

use Jetpack_Gutenberg;

const FEATURE_NAME = 'editor-notes';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	register_post_meta(
		'post',
		'jetpack-editor-notes',
		array(
			'single'        => true,
			'type'          => 'array',
			'show_in_rest'  => array(
				'schema' => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'     => array(
								'type' => 'number',
							),
							'blocks' => array(
								'type' => 'string',
							),
						),
					),
				),
			),
			'auth_callback' => 'is_user_allowed',
		)
	);

	jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Editor Notes block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Editor Notes block attributes.
 * @param string $content String containing the Editor Notes block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	if ( ! is_user_allowed() || empty( $attr['noteId'] ) ) {
		return '';
	}

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	$notes  = get_post_meta( get_the_ID(), 'jetpack-editor-notes', true );
	$blocks = '';
	foreach ( $notes as $n ) {
		if ( (int) $n['id'] === $attr['noteId'] ) {
			$blocks = $n['blocks'];
			break;
		}
	}

	return sprintf(
		'<div class="%1$s"><p class="wp-block-jetpack-editor-notes__label">%2$s</p>%3$s</div>',
		esc_attr( Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attr ) ),
		esc_html__( 'Editor Notes', 'jetpack' ),
		$blocks
	);
}

/**
 * Check if the current user is allowed to see the Editor Notes.
 *
 * @return boolean
 */
function is_user_allowed() {
	return current_user_can( 'edit_others_posts' );
}
