<?php

namespace phpmock\functions;

/**
 * Mock function for date() which returns always the same time.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 */
class FixedDateFunction implements FunctionProvider, Incrementable
{

    /**
     * @var int the timestamp.
     */
    private $timestamp;

    /**
     * Set the timestamp.
     *
     * @param int $timestamp The timestamp, if ommited the current time.
     */
    public function __construct($timestamp = null)
    {
        if (is_null($timestamp)) {
            $timestamp = \time();
        }
        if (!is_numeric($timestamp)) {
            throw new \InvalidArgumentException("Timestamp should be numeric");
        }
        $this->timestamp = $timestamp;
    }

    /**
     * Returns the mocked date() function.
     *
     * @return callable The callable for this object.
     */
    public function getCallable()
    {
        return function ($format, $timestamp = null) {
            if (is_null($timestamp)) {
                $timestamp = $this->timestamp;
            }
            return \date($format, $timestamp);
        };
    }

    public function increment($increment)
    {
        $this->timestamp += $increment;
    }
}
