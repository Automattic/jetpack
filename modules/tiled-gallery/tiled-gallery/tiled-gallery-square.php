<?php
require_once dirname( __FILE__ ) . '/tiled-gallery-layout.php';
require_once dirname( __FILE__ ) . '/tiled-gallery-item.php';

class Jetpack_Tiled_Gallery_Layout_Square extends Jetpack_Tiled_Gallery_Layout {
	protected $type = 'square';

	private function compute_items() {
		
		$content_width = Jetpack_Tiled_Gallery::get_content_width();
		$images_per_row = $this->columns;
		$margin = 2;

		$margin_space = ( $images_per_row * $margin ) * 2;
		$size = floor( ( $content_width - $margin_space ) / $images_per_row );
		$remainder = count( $this->attachments ) % $images_per_row;
		if ( $remainder > 0 ) {
			$remainder_space = ( $remainder * $margin ) * 2;
			$remainder_size = floor( ( $content_width - $remainder_space ) / $remainder );
		}

		$items = array();
		$c = 1;
		$items_in_row = 0;
		$rows = array();
		$row = new stdClass;
		$row->images = array();
		foreach( $this->attachments as $image ) {
			if ( $remainder > 0 && $c <= $remainder ) {
				$img_size = $remainder_size;
			} else {
				$img_size = $size;
			}

			$image->width = $image->height = $img_size;

			$item = new Jetpack_Tiled_Gallery_Square_Item( $image, $this->needs_attachment_link, $this->grayscale );

			$row->images[] = $item;
			$c ++;
			$items_in_row++;

			if ( $images_per_row === $items_in_row || $remainder + 1 == $c ) {
				$rows[] = $row;
				$items_in_row = 0;

				$row->height = $img_size + $margin * 2;
				$row->width = $content_width;
				$row->group_size = $img_size + 2 * $margin;

				$row = new stdClass;
				$row->images = array();
			}
		}

		if ( ! empty( $row->images ) ) {
			$row->height = $img_size + $margin * 2;
			$row->width = $content_width;
			$row->group_size = $img_size + 2 * $margin;

			$rows[] = $row;
		}

		return $rows;
	}

	public function HTML( $context = array() ) {
		return parent::HTML( array( 'rows' => $this->compute_items() ) );
	}
}
?>
