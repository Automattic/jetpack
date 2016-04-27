<?php

/**
 * WordPress Shortcode Editor View JS Code
 */
function videopress_handle_editor_view_js() {
	global $content_width;
	$current_screen = get_current_screen();
	if ( ! isset( $current_screen->id ) || $current_screen->base !== 'post' ) {
		return;
	}

	add_action( 'admin_print_footer_scripts', 'videopress_editor_view_js_templates' );

	wp_enqueue_script( 'videopress-editor-view', plugins_url( 'js/editor-view.js', __FILE__ ), array( 'wp-util', 'jquery' ), false, true );
	wp_localize_script( 'videopress-editor-view', 'vpEditorView', array(
		'home_url_host'     => parse_url( home_url(), PHP_URL_HOST ),
		'min_content_width' => VIDEOPRESS_MIN_WIDTH,
		'content_width'     => $content_width,
		'modal_labels'      => array(
			'title'     => esc_html__( 'VideoPress Shortcode', 'jetpack' ),
			'guid'      => esc_html__( 'Video ID', 'jetpack' ),
			'w'         => esc_html__( 'Video Width', 'jetpack' ),
			'w_unit'    => esc_html__( 'pixels', 'jetpack' ),
			/* Translators: example of usage of this is "Start Video After 10 seconds" */
			'at'        => esc_html__( 'Start Video After', 'jetpack' ),
			'at_unit'   => esc_html__( 'seconds', 'jetpack' ),
			'hd'        => esc_html__( 'High definition on by default', 'jetpack' ),
			'permalink' => esc_html__( 'Link the video title to its URL on VideoPress.com', 'jetpack' ),
			'autoplay'  => esc_html__( 'Autoplay video on page load', 'jetpack' ),
			'loop'      => esc_html__( 'Loop video playback', 'jetpack' ),
			'freedom'   => esc_html__( 'Use only Open Source codecs (may degrade performance)', 'jetpack' ),
			'flashonly' => esc_html__( 'Use legacy Flash Player (not recommended)', 'jetpack' ),
		)
	) );

	add_editor_style( plugins_url( 'videopress-editor-style.css', __FILE__ ) );
}
add_action( 'admin_notices', 'videopress_handle_editor_view_js' );

/**
 * WordPress Editor Views
 */
function videopress_editor_view_js_templates() {
	/**
	 * This template uses the following parameters, and displays the video as an iframe:
	 *  - data.guid     // The guid of the video.
	 *  - data.width    // The width of the iframe.
	 *  - data.height   // The height of the iframe.
	 *  - data.urlargs  // Arguments serialized into a get string.
	 *
	 * In addition, the calling script will need to ensure that the following
	 * JS file is added to the header of the editor iframe:
	 *  - https://s0.wp.com/wp-content/plugins/video/assets/js/next/videopress-iframe.js
	 */
	?>
	<script type="text/html" id="tmpl-videopress_iframe_vnext">
		<div class="tmpl-videopress_iframe_next" style="max-height:{{ data.height }}px;">
			<div class="videopress-editor-wrapper" style="padding-top:{{ data.ratio }}%;">
				<iframe style="display: block;" width="{{ data.width }}" height="{{ data.height }}" src="https://videopress.com/embed/{{ data.guid }}?{{ data.urlargs }}" frameborder='0' allowfullscreen></iframe>
			</div>
		</div>
	</script>

	<!-- VideoPress Settings Modal style overrides -->
	<style type="text/css">
		.mce-videopress-field-guid, .mce-videopress-field-freedom, .mce-videopress-field-flashonly {
			display: none;
		}
		.mce-videopress-checkbox .mce-checkbox {
			left: 120px !important;
			width: 100% !important; /* assigning a full width so the label area is clickable */
		}

		.mce-videopress-checkbox .mce-label {
			left: 150px !important;
		}
		.mce-videopress-checkbox .mce-label-unit {
			position: absolute;
			left: 210px;
			top: 5px;
		}
		.mce-videopress-checkbox i.mce-i-checkbox {
			background-color: #fff;
			color: #1e8cbe;
		}
		.mce-videopress-checkbox .mce-i-checkbox:before {
			display: inline-block;
			vertical-align: middle;
			width: 16px;
			font: 400 21px/1 dashicons;
			speak: none;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
			margin: -3px 0 0 -3px;
			content: "\f147";
		}
		.mce-videopress-checkbox .mce-i-checkbox.mce-checked:before {
			content: "\f147";
		}
		div[class*=mce-videopress-field] input[type=number] {
			width: 70px !important;
			left: 120px !important;
		}
		.mce-videopress-field-w .mce-label,
		.mce-videopress-field-at .mce-label {
			width: 115px !important;
			text-align: right;
		}
		.mce-videopress-field-unit {
			position: absolute;
			left: 210px;
			top: 5px;
		}
	</style>
	<?php
}
