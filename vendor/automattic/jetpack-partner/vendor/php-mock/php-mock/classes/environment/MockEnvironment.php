<?php

namespace phpmock\environment;

use phpmock\Deactivatable;
use phpmock\Mock;

/**
 * Container for several mocks.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 */
class MockEnvironment implements Deactivatable
{
    
    /**
     * @var Mock[] Mock environment.
     */
    private $mocks = [];
    
    /**
     * Sets the mocks for this environment.
     *
     * @param Mock[] $mocks The mocks for this environment.
     */
    public function __construct(array $mocks = [])
    {
        $this->mocks = $mocks;
    }
    
    /**
     * Adds a mock to this environment.
     *
     * @param Mock $mock Mock.
     */
    public function addMock(Mock $mock)
    {
        $this->mocks[] = $mock;
    }
    
    /**
     * Enable all mocks in this environment.
     */
    public function enable()
    {
        foreach ($this->mocks as $mock) {
            $mock->enable();
        }
    }
    
    /**
     * Define all mocks in this environment.
     *
     * @see phpmock\Mock::define()
     */
    public function define()
    {
        foreach ($this->mocks as $mock) {
            $mock->define();
        }
    }
    
    /**
     * Disable all mocks in this environment.
     */
    public function disable()
    {
        foreach ($this->mocks as $mock) {
            $mock->disable();
        }
    }
}
