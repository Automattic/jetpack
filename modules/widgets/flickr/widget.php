<!-- Start of Flickr Widget -->
<table
	border="0"
	cellpadding="0"
	cellspacing="0"
	class="flickr-size-<?php echo esc_attr( $instance['flickr_image_size'] ); ?>"
	id="flickr_badge_uber_wrapper"
>
	<tr>
		<td>
			<table border="0" cellpadding="0" cellspacing="10" id="flickr_badge_wrapper">
				<tr>
					<td align="center">
						<?php foreach ( $photos as $key => $photo ) { ?>
							<a href="<?php echo $photo['href']; ?>"><img
									alt="<?php echo $photo['title']; ?>"
									border="0"
									src="<?php echo $photo['src']; ?>"
									title="<?php echo $photo['title']; ?>"
								/></a><br /><br />
						<?php } ?>
						<?php if ( isset( $flickr_home ) ) { ?>
							<a href="<?php echo $flickr_home; ?>">
								<?php esc_html_e( 'More Photos', 'jetpack' ); ?>
							</a>
						<?php } ?>
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>
<!-- End of Flickr Widget -->
