<?php
/**
 * Eventbrite Block.
 *
 * @since 8.2.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Eventbrite;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;
use Jetpack_AMP_Support;

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
 * Get current URL.
 *
 * @return string Current URL.
 */
function get_current_url() {
	if ( isset( $_SERVER['HTTP_HOST'] ) ) {
		$host = wp_unslash( $_SERVER['HTTP_HOST'] );
	} else {
		$host = wp_parse_url( home_url(), PHP_URL_HOST );
	}
	if ( isset( $_SERVER['REQUEST_URI'] ) ) {
		$path = wp_unslash( $_SERVER['REQUEST_URI'] );
	} else {
		$path = '/';
	}
	return esc_url_raw( ( is_ssl() ? 'https' : 'http' ) . '://' . $host . $path );
}

/**
 * Eventbrite block registration/dependency delclaration.
 *
 * @param array  $attr    Eventbrite block attributes.
 * @param string $content Rendered embed element (without scripts) from the block editor.
 *
 * @return string Rendered block.
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

	// Show the embedded version.
	if ( empty( $attr['useModal'] ) && ( empty( $attr['style'] ) || 'modal' !== $attr['style'] ) ) {
		return render_embed_block( $attr, $content );
	} else {
		return render_modal_block( $attr, $content );
	}
}

/**
 * Render block with embed style.
 *
 * @param array $attr Eventbrite block attributes.
 * @return string Rendered block.
 */
function render_embed_block( $attr ) {
	$widget_id = wp_unique_id( 'eventbrite-widget-' );

	$is_amp = Jetpack_AMP_Support::is_amp_request();

	$direct_link = sprintf(
		'<a href="%s" rel="noopener noreferrer" target="_blank" class="eventbrite__direct-link" %s>%s</a>',
		esc_url( $attr['url'] ),
		$is_amp ? 'placeholder fallback' : '',
		esc_html__( 'Register on Eventbrite', 'jetpack' ),
	);

	if ( $is_amp ) {
		return sprintf(
			'<amp-iframe src="%s" layout="responsive" resizable width="1" height="1" sandbox="allow-scripts allow-same-origin allow-forms"><button overflow>%s</button>%s</amp-iframe>',
			esc_url(
				add_query_arg(
					array(
						'eid'    => $attr['eventId'],
						'parent' => rawurlencode( get_current_url() ),
					),
					'https://www.eventbrite.com/checkout-external'
				)
			),
			esc_html__( 'Expand', 'jetpack' ),
			$direct_link
		);
	}

	wp_enqueue_script( 'eventbrite-widget', 'https://www.eventbrite.com/static/widgets/eb_widgets.js', array(), JETPACK__VERSION, true );

	// Add CSS to hide direct link.
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

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
	$classes = Blocks::classes( FEATURE_NAME, $attr );

	return sprintf(
		'<div id="%1$s" class="%2$s">%3$s</div>',
		esc_attr( $widget_id ),
		esc_attr( $classes ),
		$direct_link
	);
}

/**
 * Render block with modal style.
 *
 * @param array  $attr    Eventbrite block attributes.
 * @param string $content Rendered embed element (without scripts) from the block editor.
 * @return string Rendered block.
 */
function render_modal_block( $attr, $content ) {
	$widget_id = wp_unique_id( 'eventbrite-widget-' );

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

	// Inject URL to event in case the JS for the lightbox fails to load.
	$content = preg_replace(
		'/\shref="#"/',
		sprintf(
			' href="%s" rel="noopener noreferrer" target="_blank"',
			esc_url( $attr['url'] )
		),
		$content
	);

	return $content;
}
