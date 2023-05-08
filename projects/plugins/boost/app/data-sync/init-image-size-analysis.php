<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack_Boost\Data_Sync\Image_Size_Analysis_Entry;
use Automattic\Jetpack_Boost\Data_Sync\Image_Size_Analysis_Groups;

$image_data = Schema::as_assoc_array(
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
);

$image_size_analysis = Schema::as_assoc_array(
	array(
		'query' => Schema::as_assoc_array(
			array(
				'page'   => Schema::as_number(),
				'group'  => Schema::as_string(),
				'search' => Schema::as_string(),
			)
		),
		'data'  => Schema::as_assoc_array(
			array(
				'last_updated' => Schema::as_number(),
				'total_pages'  => Schema::as_number(),
				'images'       => Schema::as_array( $image_data ),
			)
		),
	)
);

$entry = new Image_Size_Analysis_Entry();
jetpack_boost_register_option( 'image_size_analysis', $image_size_analysis, $entry );

$group_schema = Schema::as_assoc_array(
	array(
		'name'     => Schema::as_string(),
		'progress' => Schema::as_number(),
		'issues'   => Schema::as_number(),
		'done'     => Schema::as_boolean(),
	)
);
jetpack_boost_register_option(
	'image_size_analysis_groups',
	Schema::as_array( $group_schema ),
	new Image_Size_Analysis_Groups()
);

// @TODO
// Implement using class Storage_Post_Type
jetpack_boost_register_option(
	'image_size_analysis_ignored_images',
	Schema::as_array(
		$image_data
	)->fallback( array() )
);
