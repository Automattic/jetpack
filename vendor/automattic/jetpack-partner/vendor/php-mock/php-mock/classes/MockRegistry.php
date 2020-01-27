<?php

namespace phpmock;

/**
 * Enabled mock registry.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 * @see MockBuilder
 * @internal
 */
class MockRegistry
{
    
    /**
     * @var Mock[] Enabled mocks.
     */
    private $mocks = [];
    
    /**
     * @var MockRegistry Singleton.
     */
    private static $instance;
    
    /**
     * Returns the singleton.
     *
     * @return MockRegistry The singleton.
     */
    public static function getInstance()
    {
        if (empty(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Returns true if the mock is already registered.
     *
     * @param Mock $mock The mock.
     * @return bool True if the mock is registered.
     */
    public function isRegistered(Mock $mock)
    {
        return isset($this->mocks[$mock->getFQFN()]);
    }
    
    /**
     * Returns the registered mock.
     *
     * @param string $fqfn The fully qualified function name.
     * @return Mock The registered Mock.
     * @see Mock::getFQFN()
     */
    public function getMock($fqfn)
    {
        if (! isset($this->mocks[$fqfn])) {
            return null;
        }
        return $this->mocks[$fqfn];
    }
    
    /**
     * Registers a mock.
     *
     * @param Mock $mock The mock.
     */
    public function register(Mock $mock)
    {
        $this->mocks[$mock->getFQFN()] = $mock;
    }
    
    /**
     * Unregisters all mocks.
     */
    public function unregisterAll()
    {
        $this->mocks = [];
    }
    
    /**
     * Unregisters a mock.
     *
     * @param Mock $mock The mock.
     */
    public function unregister(Mock $mock)
    {
        unset($this->mocks[$mock->getFQFN()]);
    }
}
