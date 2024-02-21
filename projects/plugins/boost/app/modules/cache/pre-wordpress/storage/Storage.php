<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Storage;

/**
 * Interface for Cache storage - a system for storing and purging caches.
 */
interface Storage {

	public function write( $request_uri, $parameters, $data );
	public function read( $request_uri, $parameters );
	public function garbage_collect();
	public function invalidate( $request_uri );
	public function invalidate_single_visitor( $request_uri, $parameters );
	public function invalidate_home_page( $dir );
}
