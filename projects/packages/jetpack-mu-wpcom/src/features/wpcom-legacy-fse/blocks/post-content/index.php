<?php
/**
 * Render post content block file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Legacy_FSE;

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

/**
 * Renders post content.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block content.
 * @return string
 */
function render_post_content_block( $attributes, $content ) {
	// Early return to avoid infinite loops in the REST API.
	if ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return $content;
	}

	Common\wpcom_record_tracks_event( 'wpcom_legacy_fse_render_block', array( 'block_name' => 'a8c/post-content' ) );

	$align = isset( $attributes['align'] ) ? ' align' . $attributes['align'] : '';

	ob_start();
	?>

		<div class="post-content<?php echo esc_attr( $align ); ?>">
			<?php
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo apply_filters( 'the_content', get_the_content() );
			?>
		</div><!-- .post-content -->

	<?php
	$content = ob_get_clean();

	return $content;
}
