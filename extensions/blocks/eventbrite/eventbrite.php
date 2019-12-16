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


/**
 * Return fake embed data.
 *
 * @param array $matches Foo.
 * @return string
 */
function jetpack_eventbrite_embed_handler( $matches ) {
	if ( is_ssl() ) {
		// phpcs:disable WordPress.WP.EnqueuedResources
		return <<<SSLEMBED
			<script src="https://www.eventbrite.com/static/widgets/eb_widgets.js"></script>
			<script>
			window.EBWidgets.createWidget({
					widgetType: 'checkout',
					eventId: ${matches['eventId']},
					iframeContainerId: 'eventbrite-widget-container-${matches['eventId']}',
				});
			</script>
			<div id="eventbrite-widget-container-${matches['eventId']}"></div>
SSLEMBED;
		// phpcs:enable
	}

	return <<<SSLINFO
		SSL REQUIRED, Y'ALL
SSLINFO;
}
wp_embed_register_handler( 'jetpack-eventbrite', '/^https?:\/\/www\.eventbrite\.com(.[a-z]+)*\/e\/.*?(?P<eventId>\d+)\/?$/', 'jetpack_eventbrite_embed_handler' );

/**
 * Handle a failing oEmbed proxy request to try embedding as a shortcode.
 *
 * @see https://core.trac.wordpress.org/ticket/45447
 *
 * @param  WP_HTTP_Response|WP_Error $response The REST Request response.
 * @param  WP_REST_Server            $handler  ResponseHandler instance (usually WP_REST_Server).
 * @param  WP_REST_Request           $request  Request used to generate the response.
 * @return WP_HTTP_Response|object|WP_Error    The REST Request response.
 */
function jetpack_filter_oembed_result( $response, $handler, $request ) {
	if ( ! is_wp_error( $response ) || 'oembed_invalid_url' !== $response->get_error_code() ||
			'/oembed/1.0/proxy' !== $request->get_route() ) {
		return $response;
	}

	// Try using a classic embed instead.
	global $wp_embed;
	// phpcs:ignore WordPress.Security.NonceVerification
	$html = $wp_embed->shortcode( array(), $_GET['url'] );
	if ( ! $html ) {
		return $response;
	}

	global $wp_scripts;

	// Check if any scripts were enqueued by the shortcode, and include them in
	// the response.
	$enqueued_scripts = array();
	foreach ( $wp_scripts->queue as $script ) {
		$enqueued_scripts[] = $wp_scripts->registered[ $script ]->src;
	}

	return array(
		'provider_name' => __( 'Embed Handler', 'jetpack' ),
		'html'          => $html,
		'scripts'       => $enqueued_scripts,
	);
}
if ( ! function_exists( 'gutenberg_filter_oembed_result' ) ) {
	add_filter( 'rest_request_after_callbacks', 'jetpack_filter_oembed_result', 10, 3 );
}
