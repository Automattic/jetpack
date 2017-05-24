<p>
	<label>
		<?php esc_html_e( 'Title:', 'jetpack' ); ?>
	</label>
	<input
		class="widefat"
		name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
		type="text"
		value="<?php echo esc_attr( $instance['title'] ); ?>"
	/>
</p>

<p>
	<label>
		<?php esc_html_e( 'Flickr RSS URL:', 'jetpack' ); ?>
	</label>
	<input
		class="widefat"
		name="<?php echo esc_attr( $this->get_field_name( 'flickr_rss_url' ) ); ?>"
		type="text"
		value="<?php echo esc_attr( $instance['flickr_rss_url'] ); ?>"
	/>
</p>
<p>
	<small>
		<?php esc_html_e( 'To find your Flickr RSS URL, go to your photostream, open the "More" menu and click on "Edit". Scroll down until you see the RSS icon or the "Latest" link. Right click on either and copy the URL. Paste into the box above.', 'jetpack' ); ?>
	</small>
</p>
<p>
	<small>
		<?php printf(
			__( 'Leave the Flickr RSS URL field blank to display <a target="_blank" href="%s">interesting</a> Flickr photos.', 'jetpack' ),
			'http://www.flickr.com/explore/interesting'
		); ?>
	</small>
</p>

<p>
	<label>
		<?php esc_html_e( 'How many photos would you like to display?', 'jetpack' ); ?>
	</label>
	<select name="<?php echo esc_attr( $this->get_field_name( 'items' ) ); ?>">
		<?php for ( $i = 1; $i <= 10; ++$i ) { ?>
			<option
				<?php selected( $instance['items'], $i ); ?>
				value="<?php echo $i; ?>"
			>
				<?php echo $i; ?>
			</option>
		<?php } ?>
	</select>
</p>

<p>
	<label>
		<?php esc_html_e( 'What size photos would you like to display?', 'jetpack' ); ?>
	</label>
	<select name="<?php echo esc_attr( $this->get_field_name( 'flickr_image_size' ) ); ?>">
		<?php
		$flickr_sizes = array(
			array(
				'size' => 'thumbnail',
				'text' => esc_html__( 'Thumbnail', 'jetpack' ),
			),
			array(
				'size' => 'small',
				'text' => esc_html__( 'Small', 'jetpack' ),
			),
		);
		foreach( $flickr_sizes as $flickr_size ) { ?>
			<option
				<?php selected( $instance['flickr_image_size'], $flickr_size['size'] ); ?>
				value="<?php echo esc_attr( $flickr_size['size'] ); ?>"
			>
				<?php esc_html_e( $flickr_size['text'] ); ?>
			</option>
		<?php }
		?>
	</select>
</p>
