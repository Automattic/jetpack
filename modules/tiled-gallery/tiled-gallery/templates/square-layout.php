<?php foreach ( $rows as $row ): ?>
<div class="tiled-gallery-row"
	data-original-width="<?php echo esc_attr( $row->width ); ?>"
	data-original-height="<?php echo esc_attr( $row->height ); ?>"
>
		<?php $add_link = 'none' !== $link; ?>
		<?php foreach ( $row->images as $item ): ?>
			<div class="tiled-gallery-group"
				data-original-width="<?php echo esc_attr( $row->group_size ); ?>"
				data-original-height="<?php echo esc_attr( $row->group_size ); ?>"
			>
				<?php $this->partial( 'item', array( 'item' => $item, 'link' => $link ) ); ?>
			</div>
		<?php endforeach; ?>
	</div>
<?php endforeach; ?>
