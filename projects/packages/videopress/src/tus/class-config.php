<?php

namespace Automattic\Jetpack\VideoPress\Tus;

use InvalidArgumentException;

class Config
{
    /** @const string */
    const DEFAULT_CONFIG_PATH = __DIR__ . '/client-config.php';

    /** @var array */
    protected static $config = [];

    /**
     * Load default application configs.
     *
     * @param string|array $config
     * @param bool         $force
     *
     * @return void
     */
    public static function set($config = null, $force = false)
    {
        if ( ! is_bool( $force ) ) {
			throw new InvalidArgumentException('$force needs to be a boolean');
		}
		if ( ! $force && ! empty(self::$config)) {
            return;
        }

        if (\is_array($config)) {
            self::$config = $config;
        } else {
            self::$config = require ! empty( $config ) ? $config : self::DEFAULT_CONFIG_PATH;
        }
    }

    /**
     * Get config.
     *
     * @param string|null $key Key to extract.
     *
     * @return mixed
     */
    public static function get($key = null) //a
    {
        if ( $key !== null && ! is_string( $key ) ) {
			throw new InvalidArgumentException('$key needs to be a string');
		}
		self::set();

        if (empty($key)) {
            return self::$config;
        }

        $keys  = explode('.', $key);
        $value = self::$config;

        foreach ($keys as $k) {
            if ( ! isset($value[$k])) {
                return null;
            }

            $value = $value[$k];
        }

        return $value;
    }
}
