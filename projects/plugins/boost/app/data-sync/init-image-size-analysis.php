<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;

function jetpack_boost_mock_api( $count ) {
	$image_posts    = array();
	$offset         = 0;
	$posts_per_page = 10;

	while ( count( $image_posts ) < $count ) {
		$args = array(
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'posts_per_page' => $posts_per_page,
			'offset'         => $offset,
			'orderby'        => 'date',
			'order'          => 'DESC',
		);

		$posts = get_posts( $args );

		// Break the loop if no more posts are found.
		if ( empty( $posts ) ) {
			break;
		}

		foreach ( $posts as $post ) {
			// Get all attached images.
			$attached_images = get_attached_media( 'image', $post->ID );

			foreach ( $attached_images as $attachment ) {
				if ( count( $image_posts ) >= $count ) {
					break 2; // Break out of both loops.
				}

				$image_meta = array();

				// Get the image URL.
				$image_url                  = wp_get_attachment_url( $attachment->ID );
				$image_meta['thumbnail']    = $image_url;
				$image_meta['image']['url'] = $image_url;

				// Get image dimensions.
				list( $width, $height )                        = getimagesize( $image_url );
				$random                                        = mt_rand( 50, 90 ) / 100;
				$image_meta['image']['dimensions']['file']     = array(
					'width'  => $width,
					'height' => $height,
				);
				$image_meta['image']['dimensions']['expected'] = array(
					'width'  => $width * $random,
					'height' => $height * $random,
				);
				$image_meta['image']['dimensions']['size_on_screen'] = array(
					'width'  => ( $width * $random ) / 2,
					'height' => ( $width * $random ) / 2,
				);

				// Get image weight.
				$weight                                     = filesize( get_attached_file( get_post_thumbnail_id( $post->ID ) ) ) / 1024;
				$image_meta['image']['weight']['current']   = $weight;
				$image_meta['image']['weight']['potential'] = $weight * 0.5;

				$image_meta['page']['id']    = $post->ID;
				$permalink                   = home_url() . '?p=' . $post->ID; // Fallback permalink with query parameter
				$image_meta['page']['url']   = $permalink;
				$image_meta['page']['title'] = get_the_title( $post->ID );

				$image_meta['device_type'] = mt_rand( 1, 2 ) === 1 ? 'phone' : 'desktop';

				$image_meta['instructions'] = 'Resize the image to the expected dimensions and compress it.';

				$image_posts[] = $image_meta;
			}
		}

		$offset += $posts_per_page;
	}

	return array(
		'last_updated' => 1682419855474,
		'images'       => $image_posts,
	);
}

$image_size_analysis = Schema::as_assoc_array(
	array(
		'last_updated' => Schema::as_number(),
		'images'       => Schema::as_array(
			Schema::as_assoc_array(
				array(
					'thumbnail'    => Schema::as_string(),
					'image'        => Schema::as_assoc_array(
						array(
							'url'        => Schema::as_string(),
							'dimensions' => Schema::as_assoc_array(
								array(
									'file'           => Schema::as_assoc_array(
										array(
											'width'  => Schema::as_number(),
											'height' => Schema::as_number(),
										)
									),
									'expected'       => Schema::as_assoc_array(
										array(
											'width'  => Schema::as_number(),
											'height' => Schema::as_number(),
										)
									),
									'size_on_screen' => Schema::as_assoc_array(
										array(
											'width'  => Schema::as_number(),
											'height' => Schema::as_number(),
										)
									),
								)
							),
							'weight'     => Schema::as_assoc_array(
								array(
									'current'   => Schema::as_number(),
									'potential' => Schema::as_number(),
								)
							),
						)
					),
					'page'         => Schema::as_assoc_array(
						array(
							'id'    => Schema::as_number(),
							'url'   => Schema::as_string(),
							'title' => Schema::as_string(),
						)
					),
					'device_type'  => Schema::enum( array( 'phone', 'desktop' ) ),
					'instructions' => Schema::as_string(),
				)
			)
		),
	)
)->fallback( jetpack_boost_mock_api( 21 ) );

jetpack_boost_register_option( 'image_size_analysis', $image_size_analysis );
