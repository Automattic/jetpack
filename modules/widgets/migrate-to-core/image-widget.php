<?php
/**
 * Migration from Jetpack's Image Widget to WordPress' Core Image Widget.
 *
 * @since 4.9
 *
 * @package Jetpack
 */

/**
 * Migrates all active instances of Jetpack's image widget to Core's media image widget.
 */
function jetpack_migrate_image_widget() {
	// Only trigger the migration from wp-admin
	if ( ! is_admin() ) {
		return;
	}
	// Only migrate if the new widget is available and we haven't yet migrated
	if ( ! class_exists( 'WP_Widget_Media_Image' ) || Jetpack_Options::get_option( 'image_widget_migration' ) ) {
		return;
	}

	$default_data = array(
		'attachment_id' => 0,
		'url' => '',
		'title' => '',
		'size' => 'full',
		'width' => 0,
		'height' => 0,
		'align' => 'none',
		'caption' => '',
		'alt' => '',
		'link_type' => '',
		'link_url' => '',
		'image_classes' => '',
		'link_classes' => '',
		'link_rel' => '',
		'image_title' => '',
		'link_target_blank' => false,
	);

	$media_image      = get_option( 'widget_media_image' );
	$sidebars_widgets = wp_get_sidebars_widgets();

	foreach ( get_option( 'widget_image', array() ) as $id => $widget ) {
		if ( is_string( $id ) ) {
			continue;
		}

		$media_image[ $id ] = array_merge( $default_data, array_intersect_key( $widget, $default_data ), array(
			'alt'         => $widget['alt_text'],
			'height'      => $widget['img_height'],
			'image_classes' => ! empty( $widget['align'] ) ? 'align' . $widget['align'] : '',
			'image_title' => $widget['img_title'],
			'link_url'    => $widget['link'],
			'url'         => $widget['img_url'],
			'width'       => $widget['img_width'],
		) );

		// Check if the image is in the media library.
		$image_basename = basename( $widget['img_url'] );
		$attachment_ids = get_posts( array(
			'fields'      => 'ids',
			'meta_query'  => array(
				array(
					'value'   => basename( $image_basename ),
					'compare' => 'LIKE',
					'key'     => '_wp_attachment_metadata',
				),
			),
			'post_status' => 'inherit',
			'post_type'   => 'attachment',
		) );

		foreach ( (array) $attachment_ids as $attachment_id ) {
			$image_meta = wp_get_attachment_metadata( $attachment_id );

			// Is it a full size image?
			$image_path_pieces = explode( '/', $image_meta['file'] );
			if ( $image_basename === array_pop( $image_path_pieces ) ) {
				$media_image[ $id ]['attachment_id'] = $attachment_id;
				$media_image[ $id ]['width']         = $image_meta['width'];
				$media_image[ $id ]['height']        = $image_meta['height'];
				break;
			}

			// Is it a down-sized image?
			foreach ( $image_meta['sizes'] as $size => $image ) {
				if ( false !== array_search( $image_basename, $image ) ) {
					$media_image[ $id ]['attachment_id'] = $attachment_id;
					$media_image[ $id ]['size']          = $size;
					$media_image[ $id ]['width']         = $image['width'];
					$media_image[ $id ]['height']        = $image['height'];
					break 2;
				}
			}
		}

		if ( ! empty( $widget['link'] ) ) {
			$media_image[ $id ]['link_type'] = $widget['link'] === $widget['img_url'] ? 'file' : 'custom';
		}

		foreach ( $sidebars_widgets as $sidebar => $widgets ) {
			if ( false !== ( $key = array_search( "image-{$id}", $widgets, true ) ) ) {
				$sidebars_widgets[ $sidebar ][ $key ] = "media_image-{$id}";
			}
		}

		wp_unregister_sidebar_widget( "image-{$id}" );
		$media_image_widget = new WP_Widget_Media_Image();
		$media_image_widget->_set( $id );
		$media_image_widget->_register_one( $id );
	}

	update_option( 'widget_media_image', $media_image );
	delete_option( 'widget_image' );
	wp_set_sidebars_widgets( $sidebars_widgets );

	Jetpack_Options::update_option( 'image_widget_migration', true );

	// We need to refresh on widgets page for changes to take effect.
	add_action( 'current_screen', 'jetpack_refresh_on_widget_page' );
}
add_action( 'widgets_init', 'jetpack_migrate_image_widget' );

function jetpack_refresh_on_widget_page( $current ) {
	if ( 'widgets' === $current->base ) {
		wp_safe_redirect( admin_url( 'widgets.php' ) );
	}
}
