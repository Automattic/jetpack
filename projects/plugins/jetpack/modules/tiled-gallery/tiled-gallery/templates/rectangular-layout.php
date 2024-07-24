<?php
/**
 * Rectangular layout Tiled Gallery template.
 *
 * @html-template Jetpack_Tiled_Gallery_Layout::template
 * @package automattic/jetpack
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- HTML template, let Phan handle it.

foreach ( $context['rows'] as $row ) :
	?>
	<div
		class="gallery-row"
		style="width: <?php echo esc_attr( $row->width ); ?>px; height: <?php echo esc_attr( $row->height ); ?>px;"
		data-original-width="<?php echo esc_attr( $row->width ); ?>"
		data-original-height="<?php echo esc_attr( $row->height ); ?>"

	>
	<?php foreach ( $row->groups as $group ) : ?>
		<div
			class="gallery-group images-<?php echo esc_attr( is_countable( $group->images ) ? count( $group->images ) : 0 ); ?>"
			style="width: <?php echo esc_attr( $group->width ); ?>px; height: <?php echo esc_attr( $group->height ); ?>px;"
			data-original-width="<?php echo esc_attr( $group->width ); ?>"
			data-original-height="<?php echo esc_attr( $group->height ); ?>"
		>
			<?php
			foreach ( $group->items( $context['needs_attachment_link'], $context['grayscale'] ) as $item ) :
				$this->partial(
					'item',
					array(
						'item' => $item,
						'link' => $context['link'],
					)
				);
				?>
			<?php endforeach; ?>
		</div> <!-- close group -->
	<?php endforeach; ?>
	</div> <!-- close row -->
<?php endforeach; ?>
