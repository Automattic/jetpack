<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Option;

class Image_Size_Analysis_Ignored_Images implements Entry_Can_Get, Entry_Can_Set {

	/**
	 * Store the ignored images
	 *
	 * @var Data_Sync_Option - Ignored images are stored in a custom post type.
	 *                       (Eventually maybe swap to Storage_Post_Type or move to wpcom)
	 */
	private $storage;


	public function __construct() {
		$this->storage = new Data_Sync_Option( 'jetpack_boost_isa_ignored_images' );
	}

	public function get() {
		return $this->storage->get( [] );
	}

	public function set( $value ) {
		$this->storage->set( $value );
	}



}
