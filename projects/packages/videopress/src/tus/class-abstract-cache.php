<?php

namespace Automattic\Jetpack\VideoPress\Tus;

use InvalidArgumentException;

abstract class Abstract_Cache implements Cacheable
{
    /** @var int TTL in secs (default 1 day) */
    protected $ttl = 86400;

    /** @var string Prefix for cache keys */
    protected $prefix = 'tus:';

    /**
     * Set time to live.
     *
     * @param int $secs
     *
     * @return self
     */
    public function setTtl($secs)
    {
        if ( ! is_int( $secs ) ) {
			throw new InvalidArgumentException('$secs needs to be an integer');
		}
		$this->ttl = $secs;

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function getTtl()
    {
        return $this->ttl;
    }

    /**
     * Set cache prefix.
     *
     * @param string $prefix
     *
     * @return Cacheable
     */
    public function setPrefix($prefix)
    {
        if ( ! is_string( $prefix ) ) {
			throw new InvalidArgumentException('$prefix needs to be a string');
		}
		$this->prefix = $prefix;

        return $this;
    }

    /**
     * Get cache prefix.
     *
     * @return string
     */
    public function getPrefix()
    {
        return $this->prefix;
    }

    /**
     * Delete all keys.
     *
     * @param array $keys
     *
     * @return bool
     */
    public function deleteAll(array $keys)
    {
        if (empty($keys)) {
            return false;
        }

        $status = true;

        foreach ($keys as $key) {
            $status = $status && $this->delete($key);
        }

        return $status;
    }
}
