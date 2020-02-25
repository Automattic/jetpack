<?php

namespace phpmock\functions;

/**
 * Mock function for sleep().
 *
 * This function doesn't sleep. It returns immediatly. All registered
 * Incrementable objects (time() or microtime() mocks) get increased by the
 * passed seconds.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 */
class SleepFunction extends AbstractSleepFunction
{
    
    protected function convertToSeconds($amount)
    {
        return $amount;
    }
}
