<?php

/**
 * Things that still need doing:
 *  - Why doesn't the current values for checkboxes populate into the popup? value seems to be ignored.
 *  - Is there a way to use a query arg to hide the share link?  That'd be useful.
 *  - Get size!  Set width properly, and load in the JS to resize the iframe to set the height and such.
 *  - The secondary extension for `wpvideo` works, but on saving changes the shortcode to `videopress` -- nbd.
 *  - Should we handle other display methods apart from iframe in the editor?
 */

/**
 * WordPress Editor Views
 */
function videopress_editor_view_js_templates() {
	if ( ! isset( get_current_screen()->id ) || get_current_screen()->base != 'post' ) {
		return;
	}

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
		<div class="tmpl-videopress_iframe_next">
			<iframe width="{{ data.width }}" height="{{ data.height }}" src="https://videopress.com/embed/{{ data.guid }}?{{ data.urlargs }}" frameborder='0' allowfullscreen></iframe>
		</div>
	</script>
	<?php
}
add_action( 'admin_print_footer_scripts', 'videopress_editor_view_js_templates' );

/**
 * WordPress Shortcode Editor View JS Code
 *
 * For convenience and readability, this is printed out in the
 * footer, but ideally should be enqueued seperately.
 */
function videopress_editor_view_footer_scripts() {
	if ( ! isset( get_current_screen()->id ) || get_current_screen()->base != 'post' ) {
		return;
	}
	?>
	<script>
		/* global tinyMCE, console */
		(function( $, wp ){
			wp.mce = wp.mce || {};
			wp.mce.videopress_wp_view_renderer = {
				shortcode_string : 'videopress',
				shortcode_data : {},
				template       : wp.template( 'videopress_iframe_vnext' ),
				getContent     : function() {
					var urlargs = 'for=<?php echo esc_js( parse_url( home_url(), PHP_URL_HOST ) ); ?>',
						named = this.shortcode.attrs.named,
						options, key;

					for ( key in named ) {
						switch ( key ) {
							case 'at' :
								if ( parseInt( named[ key ], 10 ) ) {
									urlargs += '&' + key + '=' + parseInt( named[ key ], 10 );
								} // Else omit, as it's the default.
								break;
							case 'permalink' :
								if ( 'false' === named[ key ] ) {
									urlargs += '&' + key + '=0';
								} // Else omit, as it's the default.
								break;
							case 'hd' :
							case 'loop' :
							case 'autoplay' :
								if ( 'true' === named[ key ] ) {
									urlargs += '&' + key + '=1';
								} // Else omit, as it's the default.
								break;
							default:
								// Unknown parameters?  Ditch it!
								break;
						}
					}

					options = {
						width   : 600,
						height  : 360,
						guid    : this.shortcode.attrs.numeric[0],
						urlargs : urlargs
					};

					return this.template( options );
				},
				edit: function( data, update ) {
					var shortcode_data = wp.shortcode.next( this.shortcode_string, data ), // TODO: make work for wpvideo as well
						values        = shortcode_data.shortcode.attrs.named;

					values.guid = shortcode_data.shortcode.attrs.numeric[0];

					wp.mce.videopress_wp_view_renderer.popupwindow( tinyMCE.activeEditor, values );
				},
				popupwindow: function( editor, values, onsubmit_callback ){
					var renderer = this;
					values = values || {};

					if ( typeof onsubmit_callback !== 'function' ) {
						onsubmit_callback = function( e ) {
							var s = '[' + renderer.shortcode_string,
								i;
							for ( i in e.data ) {
								switch( i ) {
									case 'guid' :
										s += ' ' + e.data.guid;
										break;
									case 'w' :
									case 'at' :
										if ( parseInt( e.data[ i ], 10 ) ) {
											s += ' ' + i + '="' + parseInt( e.data[ i ], 10 ) + '"';
										} // Else omit, as it's the default.
										break;
									case 'permalink' :
										if ( ! e.data[ i ] ) {
											s += ' ' + i + '="false"';
										} // Else omit, as it's the default.
										break;
									case 'hd' :
									case 'loop' :
									case 'freedom' :
									case 'autoplay' :
									case 'flashonly' :
										if ( e.data[ i ] ) {
											s += ' ' + i + '="true"';
										} // Else omit, as it's the default.
										break;
									default:
										// Unknown parameters?  Ditch it!
										break;
								}
							}
							s += ']';
							editor.insertContent( s );
						};
					}

					editor.windowManager.open( {
						title : '<?php echo esc_js( __( 'VideoPress Shortcode', 'jetpack' ) ); ?>', // This should be internationalized via wp_localize_script
						body  : [
							{
								type  : 'textbox',
								name  : 'guid',
								label : '<?php echo esc_js( __( 'Video GUID', 'jetpack' ) ); ?>',
								value : values.guid
							},
							{
								type  : 'textbox',
								name  : 'w',
								label : '<?php echo esc_js( __( 'Width (in pixels)', 'jetpack' ) ); ?>',
								value : values.w
							},
							{
								type  : 'textbox',
								name  : 'at',
								label : '<?php echo esc_js( __( 'Start how many seconds in?', 'jetpack' ) ); ?>',
								value : values.at
							},
							{
								type  : 'checkbox',
								name  : 'hd',
								label : '<?php echo esc_js( __( 'Default to High Definition version?', 'jetpack' ) ); ?>',
								value : values.hd
							},
							{
								type  : 'checkbox',
								name  : 'loop',
								label : '<?php echo esc_js( __( 'Loop playback indefinitely?', 'jetpack' ) ); ?>',
								value : values.loop
							},
							{
								type  : 'checkbox',
								name  : 'freedom',
								label : '<?php echo esc_js( __( 'Use only Open Source codecs? (this may degrade performance)', 'jetpack' ) ); ?>',
								value : values.freedom
							},
							{
								type  : 'checkbox',
								name  : 'autoplay',
								label : '<?php echo esc_js( __( 'Autoplay video on load?', 'jetpack' ) ); ?>',
								value : values.autoplay
							},
							{
								type  : 'checkbox',
								name  : 'permalink',
								label : '<?php echo esc_js( __( 'Display the permalink to the video?', 'jetpack' ) ); ?>',
								value : values.permalink
							},
							{
								type  : 'checkbox',
								name  : 'flashonly',
								label : '<?php echo esc_js( __( 'Use the legacy flash player? (not recommended)', 'jetpack' ) ); ?>',
								value : values.flashonly
							}
						],
						onsubmit : onsubmit_callback
					} );
				}
			};
			wp.mce.views.register( 'videopress', wp.mce.videopress_wp_view_renderer );

			// Extend the videopress one to also handle `wpvideo` instances.
			wp.mce.wpvideo_wp_view_renderer = _.extend( {}, wp.mce.videopress_wp_view_renderer, {
				shortcode_string : 'wpvideo'
			});
			wp.mce.views.register( 'wpvideo', wp.mce.wpvideo_wp_view_renderer );
		}( jQuery, wp ));
	</script>
	<?php
}
add_action( 'admin_print_footer_scripts', 'videopress_editor_view_footer_scripts' );
