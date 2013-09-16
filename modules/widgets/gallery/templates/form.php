<p>
	<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:' , 'jetpack' ); ?>
		<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>"
			type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
	</label>
</p>

<p>
	<label>
		<?php esc_html_e( 'Images:' , 'jetpack' ); ?>
	</label>
</p>

<div class="gallery-widget-thumbs-wrapper">
	<div class="gallery-widget-thumbs">
		<?php

		// Add the thumbnails to the widget box
		$attachments = $this->get_attachments( $instance );

		foreach( $attachments as $attachment ){
			$url = add_query_arg( array(
				'w' 	=> self::THUMB_SIZE,
				'h' 	=> self::THUMB_SIZE,
				'crop'	=> 'true'
			), wp_get_attachment_url( $attachment->ID ) );

			?>

			<img src="<?php echo esc_url( $url ); ?>" title="<?php echo esc_attr( $attachment->post_title ); ?>" alt="<?php echo esc_attr( $attachment->post_title ); ?>"
				width="<?php echo self::THUMB_SIZE; ?>" height="<?php echo self::THUMB_SIZE; ?>" class="thumb" />
		<?php } ?>
	</div>

	<div style="clear: both;"></div>
</div>

<p>
	<a class="button gallery-widget-choose-images" title="Choose Images"><span class="wp-media-buttons-icon"></span> Choose Images</a>
</p>

<p class="gallery-widget-link-wrapper">
	<label for="<?php echo $this->get_field_id( 'link' ); ?>"><?php esc_html_e( 'Link To:' , 'jetpack' ); ?></label>
	<select name="<?php echo $this->get_field_name( 'link' ); ?>" id="<?php echo $this->get_field_id( 'link' ); ?>" class="widefat">
		<?php foreach ( $allowed_values['link'] as $key => $label ) {
			$selected = '';

			if ( $instance['link'] == $key ) {
				$selected = "selected='selected' ";
			} ?>

			<option value="<?php echo $key; ?>" <?php echo $selected; ?>><?php esc_html_e( $label , 'jetpack' ); ?></option>
		<?php } ?>
	</select>
</p>

<p>
	<label for="<?php echo $this->get_field_id( 'random' ); ?>"><?php esc_html_e( 'Random Order:' , 'jetpack' ); ?></label>
	<?php $checked = '';

	if ( isset( $instance['random'] ) && $instance['random'] )
		$checked = 'checked="checked"';

	?>
	<input name="<?php echo $this->get_field_name( 'random' ); ?>" id="<?php echo $this->get_field_id( 'random' ); ?>" type="checkbox" <?php echo $checked; ?>>
</p>

<p class="gallery-widget-style-wrapper">
	<label for="<?php echo $this->get_field_id( 'type' ); ?>"><?php esc_html_e( 'Style:' , 'jetpack' ); ?></label>
	<select name="<?php echo $this->get_field_name( 'type' ); ?>" id="<?php echo $this->get_field_id( 'type' ); ?>" class="widefat gallery-widget-style">
		<?php foreach ( $allowed_values['type'] as $key => $label ) {
			$selected = '';

			if ( $instance['type'] == $key ) {
				$selected = "selected='selected' ";
			} ?>

			<option value="<?php echo $key; ?>" <?php echo $selected; ?>><?php esc_html_e( $label, 'jetpack' ); ?></option>
		<?php } ?>
	</select>
</p>

<?php


?>

<?php // Hidden input to hold the selected image ids as a csv list ?>
<input type="hidden" class="gallery-widget-ids" name="<?php echo $this->get_field_name( 'ids' ); ?>" id="<?php echo $this->get_field_id( 'ids' ); ?>" value="<?php echo esc_attr( $instance['ids'] ); ?>" />
