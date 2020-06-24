<?php
/**
 * Eventbrite Block.
 *
 * @since 8.2.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Eventbrite;

use Jetpack_Gutenberg;

const FEATURE_NAME = 'eventbrite';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Eventbrite block registration/dependency delclaration.
 *
 * @param array  $attr    Eventbrite block attributes.
 * @param string $content Rendered embed element (without scripts) from the block editor.
 *
 * @return string
 */
function render_block( $attr, $content ) {
	if ( is_admin() || empty( $attr['eventId'] ) || empty( $attr['url'] ) ) {
		return '';
	}

	$attr['url'] = Jetpack_Gutenberg::validate_block_embed_url(
		$attr['url'],
		array( '#^https?:\/\/(?:[0-9a-z]+\.)?eventbrite\.(?:com|co\.uk|com\.ar|com\.au|be|com\.br|ca|cl|co|dk|de|es|fi|fr|hk|ie|it|com\.mx|nl|co\.nz|at|com\.pe|pt|ch|sg|se)\/e\/[^\/]*?(?:\d+)\/?(?:\?[^\/]*)?$#' ),
		true
	);

	$widget_id = wp_unique_id( 'eventbrite-widget-' );

	wp_enqueue_script( 'eventbrite-widget', 'https://www.eventbrite.com/static/widgets/eb_widgets.js', array(), JETPACK__VERSION, true );

	// Add CSS to hide direct link.
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	// Show the embedded version.
	if ( empty( $attr['useModal'] ) && ( empty( $attr['style'] ) || 'modal' !== $attr['style'] ) ) {
		wp_add_inline_script(
			'eventbrite-widget',
			"window.EBWidgets.createWidget( {
				widgetType: 'checkout',
				eventId: " . absint( $attr['eventId'] ) . ",
				iframeContainerId: '" . esc_js( $widget_id ) . "',
			} );"
		);

		// $content contains a fallback link to the event that's saved in the post_content.
		// Append a div that will hold the iframe embed created by the Eventbrite widget.js.
		$classes = Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attr );

		$content .= sprintf(
			'<div id="%1$s" class="%2$s"></div>',
			esc_attr( $widget_id ),
			esc_attr( $classes )
		);

		return sprintf(
			'%s<noscript><a href="%s" rel="noopener noreferrer" target="_blank">%s</a></noscript>',
			$content,
			esc_url( $attr['url'] ),
			esc_html__( 'Register on Eventbrite', 'jetpack' )
		);
	}

	// Show the modal version.
	wp_add_inline_script(
		'eventbrite-widget',
		"window.EBWidgets.createWidget( {
			widgetType: 'checkout',
			eventId: " . absint( $attr['eventId'] ) . ",
			modal: true,
			modalTriggerElementId: '" . esc_js( $widget_id ) . "',
		} );"
	);

	// Modal button is saved as an `<a>` element with `role="button"` because `<button>` is not allowed
	// by WordPress.com wp_kses. This javascript adds the necessary event handling for button-like behavior.
	// @link https://www.w3.org/TR/wai-aria-practices/examples/button/button.html.
	wp_add_inline_script(
		'eventbrite-widget',
		"( function() {
			var widget = document.getElementById( '" . esc_js( $widget_id ) . "' );
			if ( widget ) {
				widget.addEventListener( 'click', function( event ) {
					event.preventDefault();
				} );

				widget.addEventListener( 'keydown', function( event ) {
					// Enter and space keys.
					if ( event.keyCode === 13 || event.keyCode === 32 ) {
						event.preventDefault();
						event.target && event.target.click();
					}
				} );
			}
		} )();"
	);

	// Replace the placeholder id saved in the post_content with a unique id used by widget.js.
	$content = str_replace( 'eventbrite-widget-id', esc_attr( $widget_id ), $content );

	// Fallback for block version deprecated/v2.
	$content = preg_replace( '/eventbrite-widget-\d+/', esc_attr( $widget_id ), $content );

	return $content;
}
