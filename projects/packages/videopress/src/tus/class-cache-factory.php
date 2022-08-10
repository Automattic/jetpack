<?php
/**
 * Cache_Factory
 *
 * @package jetpack-videopress
 */

// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamComment
// phpcs:disable WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase
// phpcs:disable WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
// phpcs:disable Generic.Commenting.DocComment.MissingShort
// phpcs:disable Squiz.Commenting.FunctionComment.EmptyThrows
// phpcs:disable Squiz.PHP.CommentedOutCode.Found

namespace Automattic\Jetpack\VideoPress\Tus;

use InvalidArgumentException;

/**
 * Cache_Factory
 */
class Cache_Factory {

	/**
	 * Make cache.
	 *
	 * @param string $type
	 *
	 * @static
	 *
	 * @throws InvalidArgumentException
	 * @return Cacheable
	 */
	public static function make( $type = 'file' ) {
		if ( ! is_string( $type ) ) {
			throw new InvalidArgumentException( '$type needs to be a string' );
		}
		// Not adapted for PHP 5.6.
		// switch ($type) {
		// case 'redis':
		// return new RedisStore();
		// case 'apcu':
		// return new ApcuStore();
		// }
		return new File_Store();
	}
}
