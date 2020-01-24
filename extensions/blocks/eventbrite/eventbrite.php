<?php
/**
 * Eventbrite Block.
 *
 * @since 8.2.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/eventbrite',
	array(
		'render_callback' => 'jetpack_render_eventbrite_block',
	)
);

const JETPACK_EVENTBRITE_WIDGET_SLUG = 'eventbrite-widget';

/**
 * Eventbrite block registration/dependency delclaration.
 *
 * @param array  $attr    Eventbrite block attributes.
 * @param string $content Rendered embed element (without scripts) from the block editor.
 *
 * @return string
 */
function jetpack_render_eventbrite_block( $attr, $content ) {
	if ( empty( $attr['eventId'] ) || empty( $attr['url'] ) ) {
		return '';
	}

	$widget_id = JETPACK_EVENTBRITE_WIDGET_SLUG . '-' . $attr['eventId'];

	wp_enqueue_script( 'eventbrite-widget', 'https://www.eventbrite.com/static/widgets/eb_widgets.js', array(), JETPACK__VERSION, true );

	// Show the embedded version.
	if ( empty( $attr['useModal'] ) ) {
		wp_add_inline_script(
			'eventbrite-widget',
			"window.EBWidgets.createWidget({
				widgetType: 'checkout',
				eventId: " . absint( $attr['eventId'] ) . ",
				iframeContainerId: '" . esc_js( $widget_id ) . "',
			});"
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
		"window.EBWidgets.createWidget({
			widgetType: 'checkout',
			eventId: " . absint( $attr['eventId'] ) . ",
			modal: true,
			modalTriggerElementId: '" . esc_js( $widget_id ) . "',
		});"
	);

	return sprintf(
		'<noscript><a href="%s" rel="noopener noreferrer" target="_blank"></noscript>%s<noscript></a></noscript>',
		esc_url( $attr['url'] ),
		$content
	);
}

/**
 * Share PHP block settings with js block code.
 *
 * @return void
 */
function jetpack_eventbrite_block_editor_assets() {
	wp_localize_script(
		'jetpack-blocks-editor',
		'Jetpack_Block_Eventbrite_Settings',
		array(
			'widget_slug' => JETPACK_EVENTBRITE_WIDGET_SLUG,
		)
	);
}

add_action( 'enqueue_block_editor_assets', 'jetpack_eventbrite_block_editor_assets' );
