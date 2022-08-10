<?php
/**
 * Config
 *
 * @package jetpack-videopress
 */

// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamComment
// phpcs:disable WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase
// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
// phpcs:disable WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
// phpcs:disable Generic.Commenting.DocComment.MissingShort
// phpcs:disable Squiz.Commenting.FunctionComment.EmptyThrows
// phpcs:disable Squiz.Commenting.FunctionCommentThrowTag.WrongNumber

namespace Automattic\Jetpack\VideoPress\Tus;

use InvalidArgumentException;
/**
 * Config
 */
class Config {

	/** @const string */
	const DEFAULT_CONFIG_PATH = __DIR__ . '/client-config.php';

	/** @var array */
	protected static $config = array();

	/**
	 * Load default application configs.
	 *
	 * @param string|array $config
	 * @param bool         $force
	 *
	 * @throws InvalidArgumentException
	 * @return void
	 */
	public static function set( $config = null, $force = false ) {
		if ( ! is_bool( $force ) ) {
			throw new InvalidArgumentException( '$force needs to be a boolean' );
		}
		if ( ! $force && ! empty( self::$config ) ) {
			return;
		}

		if ( \is_array( $config ) ) {
			self::$config = $config;
		} else {
			self::$config = require ! empty( $config ) ? $config : self::DEFAULT_CONFIG_PATH; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
		}
	}

	/**
	 * Get config.
	 *
	 * @param string|null $key Key to extract.
	 *
	 * @throws InvalidArgumentException
	 * @return mixed
	 */
	public static function get( $key = null ) {
		// a
		if ( $key !== null && ! is_string( $key ) ) {
			throw new InvalidArgumentException( '$key needs to be a string' );
		}
		self::set();

		if ( empty( $key ) ) {
			return self::$config;
		}

		$keys  = explode( '.', $key );
		$value = self::$config;

		foreach ( $keys as $k ) {
			if ( ! isset( $value[ $k ] ) ) {
				return null;
			}

			$value = $value[ $k ];
		}

		return $value;
	}
}
