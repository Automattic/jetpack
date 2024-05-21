<?php
/**
 * Jetpack_Flickr_Widget frontend widget output.
 *
 * @package automattic/jetpack
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- Defined by the caller. Let Phan handle it.
'@phan-var-force Jetpack_Flickr_Widget $this';
'@phan-var-force array $instance';
'@phan-var-force string|null $flickr_home';
'@phan-var-force string $photos';

?>
<!-- Start of Flickr Widget -->
<div class="flickr-wrapper flickr-size-<?php echo esc_attr( $instance['flickr_image_size'] ); ?>">
	<div class="flickr-images">
		<?php echo $photos; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaping handled in Jetpack_Flickr_Widget class. ?>
	</div>

	<?php if ( isset( $flickr_home ) ) { ?>
		<a class="flickr-more" href="<?php echo esc_url( $flickr_home, array( 'http', 'https' ) ); ?>">
			<?php esc_html_e( 'More Photos', 'jetpack' ); ?>
		</a>
	<?php } ?>
</div>
<!-- End of Flickr Widget -->
