<?php
/**
 * Square layout Tiled Gallery template.
 *
 * @html-template Jetpack_Tiled_Gallery_Layout::template
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- HTML template, let Phan handle it.

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
				$this->partial(
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
