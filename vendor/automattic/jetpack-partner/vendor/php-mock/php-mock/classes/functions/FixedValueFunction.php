<?php

namespace phpmock\functions;

/**
 * Mock function which returns always the same value.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 */
class FixedValueFunction implements FunctionProvider, Incrementable
{
    
    /**
     * @var mixed The fixed value for the function.
     */
    private $value;
    
    /**
     * Set the value.
     *
     * @param mixed $value The value.
     */
    public function __construct($value = null)
    {
        $this->setValue($value);
    }
    
    /**
     * Returns this object as a callable for the mock function.
     *
     * @return callable The callable for this object.
     */
    public function getCallable()
    {
        return function () {
            return $this->value;
        };
    }

    /**
     * Set the value.
     *
     * @param mixed $value The value.
     */
    public function setValue($value)
    {
        $this->value = $value;
    }
    
    public function increment($increment)
    {
        $this->value += $increment;
    }
}
