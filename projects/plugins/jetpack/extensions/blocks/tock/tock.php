<?php
/**
 * Tock Block.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Tock;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'tock';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Tock block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Tock block attributes.
 * @param string $content String containing the Tock block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	$tock_name = isset( $attr['tockName'] ) ? $attr['tockName'] : '';
	if ( empty( $tock_name ) ) {
		return;
	}

	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	if ( ! wp_script_is( 'jetpack-tock-external' ) ) {
		enqueue_tock_js( $tock_name );
	}

	return $content;
}

/**
 * Enqueue Tock JS.
 *
 * @param string $tock_name Business name on Tock.
 *
 * @return void
 */
function enqueue_tock_js( $tock_name ) {
	$tock_domain = 'https://www.exploretock.com/' . $tock_name . '/';
	?>
	<script>
		!function(t,o,c,k){if(!t.tock){var e=t.tock=function(){e.callMethod?
		e.callMethod.apply(e,arguments):e.queue.push(arguments)};t._tock||(t._tock=e),
		e.push=e,e.loaded=!0,e.version='1.0',e.queue=[];var f=o.createElement(c);f.async=!0,
		f.src=k;var g=o.getElementsByTagName(c)[0];g.parentNode.insertBefore(f,g)}}(
		window,document,'script','https://www.exploretock.com/tock.js');

		tock( 'init', '<?php echo esc_js( $tock_domain ); ?>' );
	</script>
	<?php
}
