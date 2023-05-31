<?php
//phpcs:ignoreFile
// This is a DEVELOPMENT ONLY file. (WIP)
namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis;


function consistent_shuffle_array(&$array, $seed_string) {
	// Generate a seed from the input string using a hash function
	$seed = hexdec(substr(hash('sha256', $seed_string), 0, 15));

	// Seed the random number generator
	mt_srand($seed);

	// Fisher-Yates shuffle algorithm
	for ($i = count($array) - 1; $i > 0; $i--) {
		$j = mt_rand(0, $i);
		$temp = $array[$i];
		$array[$i] = $array[$j];
		$array[$j] = $temp;
	}

	// Reset the random number generator seed to a random value
	mt_srand();
}



// Temporary Mocking Function
function jetpack_boost_mock_api( $count, $group = 'all', $paged = 1 ) {
	$image_posts    = array();
	$posts_per_page = 10;

	// This is fine 🔥
	// phpcs:ignore Squiz.PHP.DisallowSizeFunctionsInLoops.Found
	$iteration = 0;
	$id = 1;
	$ignored_images = jetpack_boost_ds_get('image_size_analysis_ignored_images', array());
	$ignored_ids = wp_list_pluck( $ignored_images, 'id' );
	while ( count( $image_posts ) < $count ) {
		if( $iteration++ > 250 ) {
			break;
		}
		$args = array(
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'posts_per_page' => $posts_per_page,
			'paged'          => $paged,
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
				// Since this is a fake API, set a temporoary unique
				// ID to avoid duplicate keys when in development mode
				$image_id = md5($image_url . $id++);
				if( $image_id && in_array( $image_id, $ignored_ids ) ) {
					continue;
				}
				$image_meta['id'] = $image_id;
				$image_meta['status'] = 'active';
				// $context = '' because display encodes ampersands
				$image_meta['edit_url'] = get_edit_post_link( $post->ID, '' );
				$image_meta['thumbnail']    = $image_url;
				$image_meta['image']['url'] = $image_url;

				// Get image dimensions.
				list( $width, $height )                        = getimagesize( $image_url );
				$random                                        = random_int( 50, 90 ) / 100;
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

				$image_meta['device_type'] = random_int( 1, 2 ) === 1 ? 'phone' : 'desktop';

				$image_meta['instructions'] = 'Resize the image to the expected dimensions and compress it.';

				$image_posts[] = $image_meta;
			}
		}
	}
	consistent_shuffle_array( $image_posts, "{$group}_{$paged}" );
	return $image_posts;
}
