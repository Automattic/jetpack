<?php
/**
 * Eventbrite Block.
 *
 * @since 8.0.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/eventbrite',
	array(
		'attributes'      => array(
			'url'      => array(
				'type' => 'string',
			),
			'useModal' => array(
				'type' => 'boolean',
			),
		),
		'render_callback' => 'jetpack_eventbrite_block_load_assets',
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
function jetpack_eventbrite_block_load_assets( $attr, $content ) {
	if ( empty( $attr['url'] ) ) {
		return '';
	}

	$matches = array();
	preg_match( '/(\d+)$/', $attr['url'], $matches );
	$event_id = isset( $matches[1] ) && $matches[1] ? $matches[1] : null;

	if ( ! $event_id ) {
		return '';
	}

	wp_enqueue_script( 'eventbrite-widget', 'https://www.eventbrite.com/static/widgets/eb_widgets.js', array(), JETPACK__VERSION, true );

	// Show the embedded version.
	if ( empty( $attr['useModal'] ) ) {
		wp_add_inline_script(
			'eventbrite-widget',
			"window.EBWidgets.createWidget({
				widgetType: 'checkout',
				eventId: ${event_id},
				iframeContainerId: 'eventbrite-widget-container-${event_id}',
			});"
		);

		return <<<EOT
${content}
<noscript>
	<a href="https://www.eventbrite.com/e/${event_id}" rel="noopener noreferrer" target="_blank">Buy Tickets on Eventbrite</a>
</noscript>
EOT;
	}

	// Show the modal version.
	wp_add_inline_script(
		'eventbrite-widget',
		"window.EBWidgets.createWidget({
			widgetType: 'checkout',
			eventId: ${event_id},
			modal: true,
			modalTriggerElementId: 'eventbrite-widget-modal-trigger-${event_id}',
		});"
	);

	return <<<EOT
	<noscript><a href="https://www.eventbrite.com.au/e/${event_id}" rel="noopener noreferrer" target="_blank"></noscript>
	${content}
	<noscript>Buy Tickets on Eventbrite</a></noscript>
EOT;
}
