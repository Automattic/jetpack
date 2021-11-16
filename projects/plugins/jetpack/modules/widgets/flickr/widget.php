<!-- Start of Flickr Widget -->
<div class="flickr-wrapper flickr-size-<?php echo esc_attr( $instance['flickr_image_size'] ); ?>">
	<div class="flickr-images">
		<?php echo $photos; ?>
	</div>

	<?php if ( isset( $flickr_home ) ) { ?>
		<a class="flickr-more" href="<?php echo esc_url( $flickr_home, array( 'http', 'https' ) ); ?>">
			<?php esc_html_e( 'More Photos', 'jetpack' ); ?>
		</a>
	<?php } ?>
</div>
<!-- End of Flickr Widget -->
