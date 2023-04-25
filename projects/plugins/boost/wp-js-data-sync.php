<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack_Boost\Data_Sync\Modules_State_Entry;

if ( ! defined( 'JETPACK_BOOST_DATASYNC_NAMESPACE' ) ) {
	define( 'JETPACK_BOOST_DATASYNC_NAMESPACE', 'jetpack_boost_ds' );
}
/**
 * Make it easier to register a Jetpack Boost Data-Sync option.
 *
 * @param $key    string - The key for this option.
 * @param $schema Schema - The schema for this option.
 * @param $entry  Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry_Adapter|null - The entry handler for this option.
 */
function jetpack_boost_register_option( $key, $schema, $entry = null ) {
	Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )
			->register( $key, $schema, $entry );
}

/**
 * @param $key
 *
 * @return Data_Sync_Entry
 */
function jetpack_boost_ds_entry( $key ) {
	return Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )
					->get_registry()
					->get_entry( $key );
}

function jetpack_boost_ds_get( $key ) {
	$entry = jetpack_boost_ds_entry( $key );
	if ( ! $entry ) {
		return null;
	}
	return $entry->get();
}

function jetpack_boost_ds_set( $key, $value ) {
	$entry = jetpack_boost_ds_entry( $key );
	if ( ! $entry ) {
		return null;
	}
	return $entry->set( $value );
}

function jetpack_boost_ds_delete( $key ) {
	$entry = jetpack_boost_ds_entry( $key );
	if ( ! $entry ) {
		return null;
	}
	return $entry->delete();
}

/**
 * Ensure that Async Options are passed to the relevant scripts.
 */
function jetpack_boost_initialize_datasync() {
	$data_sync = Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE );
	$data_sync->attach_to_plugin( 'jetpack-boost-admin', 'jetpack_page_jetpack-boost' );
}

add_action( 'admin_init', 'jetpack_boost_initialize_datasync' );

$critical_css_state_schema = Schema::as_assoc_array(
	array(
		'callback_passthrough' => Schema::any_json_data()->nullable(),
		'generation_nonce'     => Schema::as_string()->nullable(),
		'proxy_nonce'          => Schema::as_string()->nullable(),
		'providers'            => Schema::as_array(
			Schema::as_assoc_array(
				array(
					'key'           => Schema::as_string(),
					'label'         => Schema::as_string(),
					'urls'          => Schema::as_array( Schema::as_string() ),
					'success_ratio' => Schema::as_float(),
					'status'        => Schema::enum( array( 'success', 'pending', 'error', 'validation-error' ) )->fallback( 'validation-error' ),
					'error_status'  => Schema::enum( array( 'active', 'dismissed' ) )->nullable(),
					'errors'        => Schema::as_array(
						Schema::as_assoc_array(
							array(
								'url'     => Schema::as_string(),
								'message' => Schema::as_string(),
								'type'    => Schema::as_string(),
								'meta'    => Schema::any_json_data()->nullable(),
							)
						)->fallback( array() )
					)->nullable(),
				)
			)
		)->nullable(),
		'status'               => Schema::enum( array( 'not_generated', 'generated', 'pending', 'error' ) )->fallback( 'not_generated' ),
		'updated'              => Schema::as_float()->nullable(),
		'status_error'         => Schema::as_string()->nullable(),
		'created'              => Schema::as_float()->nullable(),
		'viewports'            => Schema::as_array(
			Schema::as_assoc_array(
				array(
					'type'   => Schema::as_string(),
					'width'  => Schema::as_number(),
					'height' => Schema::as_number(),
				)
			)
		)->fallback( array() ),
	)
)->fallback(
	array(
		'status'               => 'not_generated',
		'providers'            => array(),
		'callback_passthrough' => null,
		'generation_nonce'     => null,
		'proxy_nonce'          => null,
		'viewports'            => array(),
		'created'              => null,
		'updated'              => null,
	)
);

/**
 * Register Data Sync Stores
 */
jetpack_boost_register_option( 'critical_css_state', $critical_css_state_schema );
jetpack_boost_register_option( 'critical_css_suggest_regenerate', Schema::as_boolean()->fallback( false ) );

$modules_state_schema = Schema::as_array(
	Schema::as_assoc_array(
		array(
			'active'    => Schema::as_boolean()->fallback( false ),
			'available' => Schema::as_boolean()->nullable(),
		)
	)
)->fallback( array() );

$entry = new Modules_State_Entry();
jetpack_boost_register_option( 'modules_state', $modules_state_schema, $entry );

function jetpack_boost_mock_api( $count ) {
	$args = array(
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'posts_per_page' => $count,
		'orderby'        => 'date',
		'order'          => 'DESC',
		'meta_query'     => array(
			array(
				'key'     => '_thumbnail_id',
				'compare' => 'EXISTS',
			),
		),
	);

	$posts       = get_posts( $args );
	$image_posts = array();

	foreach ( $posts as $post ) {
		$image_meta = array();

		// Get the featured image.
		$image_url                  = get_the_post_thumbnail_url( $post->ID );
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
)->fallback( jetpack_boost_mock_api( 10 ) );

jetpack_boost_register_option( 'image_size_analysis', $image_size_analysis );
