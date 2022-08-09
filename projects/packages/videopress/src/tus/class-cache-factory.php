<?php

namespace Automattic\Jetpack\VideoPress\Tus;

class Cache_Factory
{
    /**
     * Make cache.
     *
     * @param string $type
     *
     * @static
     *
     * @return Cacheable
     */
    public static function make($type = 'file')
    {
        if ( ! is_string( $type ) ) {
			throw new InvalidArgumentException('$type needs to be a string');
		}
		// Not adapted for PHP 5.6.
		// switch ($type) {
        //     case 'redis':
        //         return new RedisStore();
        //     case 'apcu':
        //         return new ApcuStore();
        // }
        return new FileStore();
    }
}
