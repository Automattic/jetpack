<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Storage;

/**
 * Interface for Cache storage - a system for storing and purging caches.
 */
interface Storage {

	public function write( $request_uri, $parameters, $data );
	public function read( $request_uri, $parameters );
	public function reset_rebuild_file( $request_uri, $parameters );

	public function clear( $path, $args = array() );
	public function garbage_collect( $cache_ttl = JETPACK_BOOST_CACHE_DURATION );
}
