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
			'eventId' => array(
				'type' => 'string',
			),
		),
		'render_callback' => 'jetpack_eventbrite_block_load_assets',
	)
);

/**
 * Eventbrite block registration/dependency delclaration.
 *
 * @param array $attr    Eventbrite block attributes.
 *
 * @return string
 */
function jetpack_eventbrite_block_load_assets( $attr ) {
	if ( empty( $attr['eventId'] ) ) {
		return '';
	}

	wp_enqueue_script( 'eventbrite-widget', 'https://www.eventbrite.com/static/widgets/eb_widgets.js', array(), JETPACK__VERSION, true );
	wp_add_inline_script(
		'eventbrite-widget',
		"window.EBWidgets.createWidget({
			widgetType: 'checkout',
			eventId: ${attr['eventId']},
			iframeContainerId: 'eventbrite-widget-container-${attr['eventId']}',
		});"
	);

	return <<<EOT
<div id="eventbrite-widget-container-${attr['eventId']}"></div>
<noscript>
	<a href="https://www.eventbrite.com/e/${attr['eventId']}" rel="noopener noreferrer" target="_blank">Buy Tickets on Eventbrite</a>
</noscript>
EOT;
}
