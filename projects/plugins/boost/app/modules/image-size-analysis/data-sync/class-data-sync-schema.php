<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Data_Sync;

use Automattic\Jetpack\Schema\Schema;

class Data_Sync_Schema {
	public static function image_data() {
		return Schema::as_assoc_array(
			array(
				'id'           => Schema::as_string(),
				'thumbnail'    => Schema::as_string(),
				'device_type'  => Schema::enum( array( 'phone', 'desktop' ) ),
				'status'       => Schema::enum( array( 'active', 'ignored' ) )->fallback( 'active' ),
				'instructions' => Schema::as_string(),
				'type'         => Schema::enum( array( 'image_size', 'bad_entry', 'image_missing' ) )->fallback( 'bad_entry' ),
				'page'         => Schema::as_assoc_array(
					array(
						'id'       => Schema::as_number(),
						'url'      => Schema::as_string(),
						'edit_url' => Schema::as_string()->nullable(),
						'title'    => Schema::as_string(),
					)
				),
				'image'        => Schema::as_assoc_array(
					array(
						'url'        => Schema::as_string(),
						'fixed'      => Schema::as_boolean()->fallback( false ),
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
				)->nullable(),

			)
		)->nullable();
	}

	public static function image_size_analysis() {
		return Schema::as_assoc_array(
			array(
				'last_updated' => Schema::as_number(),
				'total_pages'  => Schema::as_number(),
				'images'       => Schema::as_array( self::image_data() ),
			)
		);
	}

	public static function image_size_analysis_paginate() {
		return Schema::as_assoc_array(
			array(
				'page'  => Schema::as_number(),
				'group' => Schema::as_string(),
			)
		);
	}

	public static function image_size_analysis_fix() {
		return Schema::as_assoc_array(
			array(
				'image_id'     => Schema::as_number(),
				'image_url'    => Schema::as_string(),
				'image_width'  => Schema::as_number(),
				'image_height' => Schema::as_number(),
				'post_id'      => Schema::as_number(),
				'fix'          => Schema::as_boolean(),
			)
		);
	}

	public static function group_schema() {
		return Schema::as_assoc_array(
			array(
				'issue_count'   => Schema::as_number(),
				'scanned_pages' => Schema::as_number(),
				'total_pages'   => Schema::as_number(),
			)
		)->nullable();
	}

	public static function image_size_analysis_summary() {
		return Schema::as_assoc_array(
			array(
				'status'    => Schema::enum(
					array(
						'not-found',
						'new',
						'queued',
						'completed',
						'error',
						'error_stuck',
					)
				),
				'message'   => Schema::as_string()->nullable(),
				'report_id' => Schema::as_number()->nullable(),
				'groups'    => Schema::as_assoc_array(
					array(
						'core_front_page' => self::group_schema(),
						'singular_page'   => self::group_schema(),
						'singular_post'   => self::group_schema(),
						'other'           => self::group_schema(),
						'fixed'           => self::group_schema(),
					)
				)->nullable(),
			)
		)->fallback(
			array(
				'status' => 'not-found',
				'groups' => null,
			)
		);
	}
}
