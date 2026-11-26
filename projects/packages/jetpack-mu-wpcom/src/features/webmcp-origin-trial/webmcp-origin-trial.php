<?php
/**
 * Enable the WebMCP origin trial for Automatticians in the block editors.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

add_action(
	'admin_print_scripts',
	static function () {
		$screen = get_current_screen();
		if ( ! $screen || ! in_array( $screen->base, array( 'post', 'site-editor' ), true ) || ! $screen->is_block_editor() ) {
			return;
		}

		if ( ! function_exists( 'is_automattician' ) || ! is_automattician() ) {
			return;
		}

		// Chrome validates the third-party token against the origin of this script.
		wp_print_script_tag( array( 'src' => 'https://s0.wp.com/wp-content/js/webmcp-origin-trial.js' ) );
	},
	0
);
