<?php

namespace phpmock\functions;

/**
 * Abstract class for sleep() and usleep() functions.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 */
abstract class AbstractSleepFunction implements FunctionProvider
{
    
    /**
     * @var Incrementable[] Observing Incrementables.
     */
    private $incrementables = [];
    
    /**
     * Sets the Incrementable objects.
     *
     * @param Incrementable[] $incrementables Observing Incrementables.
     * @see addIncrementable()
     */
    public function __construct(array $incrementables = [])
    {
        $this->incrementables = $incrementables;
    }
    
    /**
     * Returns the sleep() mock function.
     *
     * A call will increase all registered Increment objects.
     *
     * @return callable The callable for this object.
     */
    public function getCallable()
    {
        return function ($amount) {
            foreach ($this->incrementables as $incrementable) {
                $incrementable->increment($this->convertToSeconds($amount));
            }
        };
    }

    /**
     * Converts the sleep() parameter into seconds.
     *
     * @param int $amount Amount of time units.
     * @return mixed Seconds.
     * @internal
     */
    abstract protected function convertToSeconds($amount);

    /**
     * Adds an Incrementable object.
     *
     * These objects are observing this function and get notified by
     * increasing the amount of passed time. Incrementables are used
     * for time() and microtime() mocks.
     *
     * @param Incrementable $incrementable Observing Incrementable.
     */
    public function addIncrementable(Incrementable $incrementable)
    {
        $this->incrementables[] = $incrementable;
    }
}
