<?php
// See https://github.com/Automattic/jetpack/issues/2765
$fuzzy_image_meta = $item->fuzzy_image_meta();
if ( isset( $fuzzy_image_meta['keywords'] ) ) {
	unset( $fuzzy_image_meta['keywords'] );
}

if ( defined( 'JSON_HEX_AMP' ) ) {
	// see shortcodes/slideshow.php
	// This is nice to have, but not strictly necessary since we use _wp_specialchars() below
	// phpcs:ignore PHPCompatibility
	$fuzzy_image_meta = json_encode( array_map( 'strval', $fuzzy_image_meta ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
} else {
	$fuzzy_image_meta = json_encode( array_map( 'strval', $fuzzy_image_meta ) );
}
?>
data-attachment-id="<?php echo esc_attr( $item->image->ID ); ?>"
data-orig-file="<?php echo esc_url( wp_get_attachment_url( $item->image->ID ) ); ?>"
data-orig-size="<?php echo esc_attr( $item->meta_width() ); ?>,<?php echo esc_attr( $item->meta_height() ); ?>"
data-comments-opened="<?php echo esc_attr( comments_open( $item->image->ID ) ); ?>"
data-image-meta="<?php echo _wp_specialchars( wp_check_invalid_utf8( $fuzzy_image_meta ), ENT_QUOTES, false, true ); ?>"
data-image-title="<?php echo esc_attr( htmlspecialchars( wptexturize( $item->image->post_title ) ) ); ?>"
data-image-description="<?php echo esc_attr( htmlspecialchars( wpautop( wptexturize( $item->image->post_content ) ) ) ); ?>"
data-medium-file="<?php echo esc_url( $item->medium_file() ); ?>"
data-large-file="<?php echo esc_url( $item->large_file() ); ?>"
