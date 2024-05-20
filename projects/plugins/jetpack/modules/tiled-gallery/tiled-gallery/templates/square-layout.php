<?php
/**
 * Square layout Tiled Gallery template.
 *
 * @package automattic/jetpack
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- Defined by the caller. Let Phan handle it.
'@phan-var-force Jetpack_Tiled_Gallery_Layout $this';
'@phan-var-force array $context';

foreach ( $context['rows'] as $row ) :
	?>
	<div class="gallery-row"
		style="width: <?php echo esc_attr( $row->width ); ?>px; height: <?php echo esc_attr( $row->height ); ?>px;"
		data-original-width="<?php echo esc_attr( $row->width ); ?>"
		data-original-height="<?php echo esc_attr( $row->height ); ?>"
	>
		<?php foreach ( $row->images as $item ) : ?>
			<div class="gallery-group"
				style="width: <?php echo esc_attr( $row->group_size ); ?>px; height: <?php echo esc_attr( $row->group_size ); ?>px;"
				data-original-width="<?php echo esc_attr( $row->group_size ); ?>"
				data-original-height="<?php echo esc_attr( $row->group_size ); ?>"
			>
				<?php
				$this->partial( // @phan-suppress-current-line PhanAccessMethodPrivate -- Called in the scope of the class.
					'item',
					array(
						'item' => $item,
						'link' => $context['link'],
					)
				);
				?>
			</div>
		<?php endforeach; ?>
	</div>
<?php endforeach; ?>
