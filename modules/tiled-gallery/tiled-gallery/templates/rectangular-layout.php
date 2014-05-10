<?php foreach ( $this->rows as $row ): ?>
	<div
		class="gallery-row"
		style="width: <?php echo esc_attr( $row->width ); ?>px; height: <?php echo esc_attr( $row->height ); ?>px;"
		data-original-width="<?php echo esc_attr( $row->width ); ?>"
		data-original-height="<?php echo esc_attr( $row->height ); ?>"

	>
	<?php foreach ( $row->groups as $group ): ?>
		<div
			class="gallery-group images-<?php echo esc_attr( count( $group->images ) ); ?>"
			style="width: <?php echo esc_attr( $group->width ); ?>px; height: <?php echo esc_attr( $group->height ); ?>px;"
			data-original-width="<?php echo esc_attr( $group->width ); ?>"
			data-original-height="<?php echo esc_attr( $group->height ); ?>"
		>
			<?php $this->partial( 'items', array( 'items' => $group->items( $this->needs_attachment_link, $this->grayscale ) ) ); ?>
		</div> <!-- close group -->
	<?php endforeach; ?>
	</div> <!-- close row -->
<?php endforeach; ?>
