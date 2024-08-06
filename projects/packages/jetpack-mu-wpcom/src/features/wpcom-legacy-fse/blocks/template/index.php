<?php
/**
 * Render template block file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Legacy_FSE;

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

/**
 * Renders template.
 *
 * @param array $attributes Block attributes.
 * @return string
 */
function render_template_block( $attributes ) {
	if ( ! isset( $attributes['templateId'] ) || ! is_int( $attributes['templateId'] ) ) {
		return '';
	}

	Common\wpcom_record_tracks_event( 'wpcom_legacy_fse_render_block', array( 'block_name' => 'a8c/template' ) );

	$template = get_post( $attributes['templateId'] );

	$align = isset( $attributes['align'] ) ? ' align' . $attributes['align'] : '';

	setup_postdata( $template );
	ob_start();
	?>

		<div class="template<?php echo esc_attr( $align ); ?>">
			<?php
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo apply_filters( 'the_content', get_the_content() );
			?>
		</div><!-- .template -->

	<?php
	$content = ob_get_clean();
	wp_reset_postdata();

	return $content;
}
