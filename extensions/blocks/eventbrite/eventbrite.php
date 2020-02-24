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

/**
 * Eventbrite block registration/dependency delclaration.
 *
 * @param array  $attr    Eventbrite block attributes.
 * @param string $content Rendered embed element (without scripts) from the block editor.
 *
 * @return string
 */
function jetpack_render_eventbrite_block( $attr, $content ) {
	if ( is_admin() || empty( $attr['eventId'] ) || empty( $attr['url'] ) ) {
		return '';
	}

	$widget_id = wp_unique_id( 'eventbrite-widget-' );

	wp_enqueue_script( 'eventbrite-widget', 'https://www.eventbrite.com/static/widgets/eb_widgets.js', array(), JETPACK__VERSION, true );

	// Add CSS to hide direct link.
	Jetpack_Gutenberg::load_assets_as_required( 'eventbrite' );

	// Show the embedded version.
	if ( empty( $attr['useModal'] ) ) {
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
		$content .= sprintf(
			'<div id="%s" class="eventbrite__in-page-checkout"></div>',
			esc_attr( $widget_id )
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
	$content = preg_replace( '/eventbrite-widget-\d+/', $widget_id, $content );

	return $content;
}
