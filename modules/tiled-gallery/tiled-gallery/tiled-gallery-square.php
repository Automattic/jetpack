<?php
require_once dirname( __FILE__ ) . '/tiled-gallery-layout.php';

class Jetpack_Tiled_Gallery_Layout_Square extends Jetpack_Tiled_Gallery_Layout {
	protected $type = 'square';

	public function HTML() {
		$content_width = Jetpack_Tiled_Gallery::get_content_width();
		$images_per_row = 3;
		$margin = 2;

		$margin_space = ( $images_per_row * $margin ) * 2;
		$size = floor( ( $content_width - $margin_space ) / $images_per_row );
		$remainder = count( $this->attachments ) % $images_per_row;
		if ( $remainder > 0 ) {
			$remainder_space = ( $remainder * $margin ) * 2;
			$remainder_size = ceil( ( $content_width - $remainder_space ) / $remainder );
		}
		$output = $this->generate_carousel_container();
		$c = 1;
		$items_in_row = 0;
		foreach( $this->attachments as $image ) {
			if ( $remainder > 0 && $c <= $remainder )
				$img_size = $remainder_size;
			else
				$img_size = $size;

			// Add a row container for all new rows
			if ( 0 == $items_in_row ) {
				$original_dimensions = ' data-original-width="' . esc_attr( $content_width ) . '" data-original-height="' . esc_attr( $img_size + $margin * 2 ) . '" ';
				$output .= '<div' . $original_dimensions . 'class="gallery-row" style="width:' . esc_attr( $content_width ) . 'px; height: ' . esc_attr( $img_size + $margin * 2 ) . 'px;" >';
			}

			$orig_file = wp_get_attachment_url( $image->ID );
			$link = $this->get_attachment_link( $image->ID, $orig_file );
			$image_title = $image->post_title;

			$img_src = add_query_arg( array( 'w' => $img_size, 'h' => $img_size, 'crop' => 1 ), $orig_file );

			$orig_dimensions = ' data-original-width="' . esc_attr( $img_size + 2 * $margin ) . '" data-original-height="' . esc_attr( $img_size + 2 * $margin ) . '" ';
			$output .= '<div class="gallery-group"' . $orig_dimensions . '><div class="tiled-gallery-item">';

			$add_link = 'none' !== $this->atts['link'];
			$orig_dimensions = ' data-original-width="' . esc_attr( $img_size ) . '" data-original-height="' . esc_attr( $img_size ) . '" ';

			if ( $add_link ) {
				$output .= '<a border="0" href="' . esc_url( $link ) . '">';
			}
			$output .= '<img ' . $orig_dimensions . $this->generate_carousel_image_args( $image ) . ' src="' . esc_url( $img_src ) . '" width="' . esc_attr( $img_size ) . '" height="' . esc_attr( $img_size ) . '" style="width:' . esc_attr( $img_size ) . 'px; height:' . esc_attr( $img_size ) . 'px; margin: ' . esc_attr( $margin ) . 'px;" title="' . esc_attr( $image_title ) . '" />';
			if ( $add_link ) {
				$output .= '</a>';
			}

			// Grayscale effect
			if ( $this->atts['grayscale'] == true ) {
				$src = urlencode( $image->guid );
				if ( $add_link ) {
					$output .= '<a border="0" href="' . esc_url( $link ) . '">';
				}
				$output .= '<img ' . $orig_dimensions . ' class="grayscale" src="' . esc_url( 'http://en.wordpress.com/imgpress?url=' . urlencode( $image->guid ) . '&resize=' . $img_size . ',' . $img_size . '&filter=grayscale' ) . '" width="' . esc_attr( $img_size ) . '" height="' . esc_attr( $img_size ) . '" style=width:' . esc_attr( $img_size ) . 'px; height:' . esc_attr( $img_size ) . 'px; margin: 2px;" title="' . esc_attr( $image_title ) . '" />';
				if ( $add_link ) {
					$output .= '</a>';
				}
			}

			// Captions
			if ( trim( $image->post_excerpt ) )
				$output .= '<div class="tiled-gallery-caption">' . wptexturize( $image->post_excerpt ) . '</div>';
			$output .= '</div></div>';
			$c ++;
			$items_in_row ++;

			// Close the row container for all new rows and remainder area
			if ( $images_per_row == $items_in_row || $remainder + 1 == $c ) {
				$output .= '</div>';
				$items_in_row = 0;
			}
		}
		$output .= '</div>';
		return $output;
	}
}

