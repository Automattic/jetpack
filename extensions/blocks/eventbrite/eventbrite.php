<?php
/**
 * Eventbrite Block.
 *
 * @since 8.0.0
 *
 * @package Jetpack
 */

const JETPACK_EVENTBRITE_ID_FROM_URL_REGEX = '(\d+)\/?\s*$';
const JETPACK_EVENTBRITE_WIDGET_SLUG       = 'eventbrite-widget';

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
	if ( empty( $attr['url'] ) ) {
		return '';
	}

	$matches = array();
	preg_match( '/' . JETPACK_EVENTBRITE_ID_FROM_URL_REGEX . '/', $attr['url'], $matches );
	$event_id = isset( $matches[1] ) && $matches[1] ? $matches[1] : null;

	if ( ! $event_id ) {
		return '';
	}

	$widget_id      = JETPACK_EVENTBRITE_WIDGET_SLUG . '-' . $event_id;
	$no_script_text = __( 'Register on Eventbrite', 'jetpack' );

	wp_enqueue_script( 'eventbrite-widget', 'https://www.eventbrite.com/static/widgets/eb_widgets.js', array(), JETPACK__VERSION, true );

	// Show the embedded version.
	if ( empty( $attr['useModal'] ) ) {
		wp_add_inline_script(
			'eventbrite-widget',
			"window.EBWidgets.createWidget({
				widgetType: 'checkout',
				eventId: ${event_id},
				iframeContainerId: '${widget_id}',
			});"
		);

		return <<<EOT
${content}
<noscript>
	<a href="${attr['url']}" rel="noopener noreferrer" target="_blank">${no_script_text}</a>
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
			modalTriggerElementId: '${widget_id}',
		});"
	);

	return <<<EOT
	<noscript><a href="${attr['url']}" rel="noopener noreferrer" target="_blank"></noscript>
	${content}
	<noscript></a></noscript>
EOT;
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
			'event_id_from_url_regex' => JETPACK_EVENTBRITE_ID_FROM_URL_REGEX,
			'widget_slug'             => JETPACK_EVENTBRITE_WIDGET_SLUG,
		)
	);
}

add_action( 'enqueue_block_editor_assets', 'jetpack_eventbrite_block_editor_assets' );
