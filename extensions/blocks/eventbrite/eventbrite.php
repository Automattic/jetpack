<?php
/**
 * Eventbrite Block.
 *
 * @since 8.0.0
 *
 * @package Jetpack
 */

if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || Jetpack::is_active() ) {
	jetpack_register_block(
		'jetpack/eventbrite',
		array(
			'attributes'      => array(
				'eventId'  => array(
					'type' => 'string',
				),
				'useModal' => array(
					'type' => 'boolean',
				),
			),
			'render_callback' => 'jetpack_eventbrite_block_load_assets',
		)
	);
}

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

	// Show the embedded version.
	if ( empty( $attr['useModal'] ) ) {
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

	// Show the modal version.
	wp_add_inline_script(
		'eventbrite-widget',
		"window.EBWidgets.createWidget({
			widgetType: 'checkout',
			eventId: ${attr['eventId']},
			modal: true,
			modalTriggerElementId: 'eventbrite-widget-modal-trigger-${attr['eventId']}',
		});"
	);

	return <<<EOT
	<noscript><a href="https://www.eventbrite.com.au/e/${attr['eventId']}" rel="noopener noreferrer" target="_blank"></noscript>
	<button id="eventbrite-widget-modal-trigger-${attr['eventId']}" type="button">Buy Tickets</button>
	<noscript></a>Buy Tickets on Eventbrite</noscript>
EOT;
}
