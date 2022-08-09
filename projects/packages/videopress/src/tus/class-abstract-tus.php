<?php

namespace Automattic\Jetpack\VideoPress\Tus;

use TusPhp\Cache\Cacheable;
use TusPhp\Cache\CacheFactory;
use Symfony\Component\EventDispatcher\EventDispatcher;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;

abstract class Abstract_Tus
{
    /** @const string Tus protocol version. */
    const TUS_PROTOCOL_VERSION = '1.0.0';

    /** @const string Upload type partial. */
    const UPLOAD_TYPE_PARTIAL = 'partial';

    /** @const string Upload type final. */
    const UPLOAD_TYPE_FINAL = 'final';

    /** @const string Name separator for partial upload. */
    const PARTIAL_UPLOAD_NAME_SEPARATOR = '_';

    /** @const string Upload type normal. */
    const UPLOAD_TYPE_NORMAL = 'normal';

    /** @const string Header Content Type */
    const HEADER_CONTENT_TYPE = 'application/offset+octet-stream';

    /** @var Cacheable */
    protected $cache;

    /** @var string */
    protected $apiPath = '/files';

    /** @var EventDispatcherInterface */
    protected $dispatcher;

    /**
     * Set cache.
     *
     * @param mixed $cache
     *
     * @throws \ReflectionException
     *
     * @return self
     */
    public function setCache($cache)
    {
        if (\is_string($cache)) {
            $this->cache = CacheFactory::make($cache);
        } elseif ($cache instanceof Cacheable) {
            $this->cache = $cache;
        }

        $prefix = 'tus:' . strtolower((new \ReflectionClass(static::class))->getShortName()) . ':';

        $this->cache->setPrefix($prefix);

        return $this;
    }

    /**
     * Get cache.
     *
     * @return Cacheable
     */
    public function getCache()
    {
        return $this->cache;
    }

    /**
     * Set API path.
     *
     * @param string $path
     *
     * @return self
     */
    public function setApiPath($path)
    {
        if ( ! is_string( $path ) ) {
			throw new InvalidArgumentException('$path needs to be a string');
		}

		$this->apiPath = $path;

        return $this;
    }

    /**
     * Get API path.
     *
     * @return string
     */
    public function getApiPath()
    {
        return $this->apiPath;
    }

    /**
     * Set and get event dispatcher.
     *
     * @return EventDispatcherInterface
     */
    public function event()
    {
        if ( ! $this->dispatcher) {
            $this->dispatcher = new EventDispatcher();
        }

        return $this->dispatcher;
    }

    /**
     * Set event dispatcher.
     *
     * @param EventDispatcherInterface $dispatcher
     *
     * @return self
     */
    public function setDispatcher(EventDispatcherInterface $dispatcher)
    {
        $this->dispatcher = $dispatcher;

        return $this;
    }
}
