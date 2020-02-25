<?php

namespace phpmock\functions;

/**
 * Mock function for microtime which returns always the same time.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 */
class FixedMicrotimeFunction implements FunctionProvider, Incrementable
{

    /**
     * @var string the timestamp in PHP's microtime() string format.
     */
    private $timestamp;

    /**
     * Set the timestamp.
     *
     * @param mixed $timestamp The timestamp, if ommited the current time.
     *
     * @SuppressWarnings(PHPMD)
     */
    public function __construct($timestamp = null)
    {
        if (is_null($timestamp)) {
            $this->setMicrotime(\microtime());
        } elseif (is_string($timestamp)) {
            $this->setMicrotime($timestamp);
        } elseif (is_numeric($timestamp)) {
            $this->setMicrotimeAsFloat($timestamp);
        } else {
            throw new \InvalidArgumentException(
                "Timestamp parameter is invalid type."
            );
        }
    }

    /**
     * Returns this object as a callable for the mock function.
     *
     * @return callable The callable for this object.
     */
    public function getCallable()
    {
        return [$this, "getMicrotime"];
    }

    /**
     * Set the timestamp as string.
     *
     * @param string $timestamp The timestamp as string.
     */
    public function setMicrotime($timestamp)
    {
        if (empty($timestamp)) {
            throw new \InvalidArgumentException("Timestamp should not be empty");
        }
        $this->timestamp = $timestamp;
    }

    /**
     * Set the timestamp as float.
     *
     * @param float $timestamp The timestamp as float.
     */
    public function setMicrotimeAsFloat($timestamp)
    {
        if (!is_numeric($timestamp)) {
            throw new \InvalidArgumentException("Timestamp should be numeric");
        }
        $converter = new MicrotimeConverter();
        $this->timestamp = $converter->convertFloatToString($timestamp);
    }

    /**
     * Returns the microtime.
     *
     * @param bool $get_as_float If true returns timestamp as float, else string
     * @return mixed The value.
     * @SuppressWarnings(PHPMD)
     */
    public function getMicrotime($get_as_float = false)
    {
        if ($get_as_float) {
            $converter = new MicrotimeConverter();
            return $converter->convertStringToFloat($this->timestamp);
        } else {
            return $this->timestamp;
        }
    }

    /**
     * Returns the time without the microseconds.
     *
     * @return int The time.
     */
    public function getTime()
    {
        return (int) $this->getMicrotime(true);
    }

    public function increment($increment)
    {
        $this->setMicrotimeAsFloat($this->getMicrotime(true) + $increment);
    }
}
