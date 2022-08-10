<?php
/**
 * Tus client configuration
 *
 * @package jetpack-videopress
 */

return array(

	/**
	 * Redis connection parameters.
	 */
	'redis' => array(
		'host'     => getenv( 'REDIS_HOST' ) !== false ? getenv( 'REDIS_HOST' ) : '127.0.0.1',
		'port'     => getenv( 'REDIS_PORT' ) !== false ? getenv( 'REDIS_PORT' ) : '6379',
		'database' => getenv( 'REDIS_DB' ) !== false ? getenv( 'REDIS_DB' ) : 0,
	),

	/**
	 * File cache configs.
	 */
	'file'  => array(
		'dir'  => \dirname( __DIR__ ) . DIRECTORY_SEPARATOR . '.cache' . DIRECTORY_SEPARATOR,
		'name' => 'tus_php.client.cache',
	),
);
