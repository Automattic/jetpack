<?php

namespace phpmock\spy;

/**
 * A function call with its arguments and result.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 */
class Invocation
{
    
    /**
     * @var mixed The function call's return value.
     */
    private $return;
    
    /**
     * @var array The function call's arguments.
     */
    private $arguments;
    
    /**
     * @var \Exception|null The exception thrown by the function.
     */
    private $exception;

    /**
     * Sets the arguments and return value
     *
     * @param array $arguments Function's arguments
     * @param mixed $return Function's return value
     * @param \Exception $exception The exception thrown by the function
     *
     * @internal
     */
    public function __construct(array $arguments, $return, \Exception $exception = null)
    {
        $this->arguments = $arguments;
        $this->return    = $return;
        $this->exception = $exception;
    }

    /**
     * Returns the arguments of a function call.
     *
     * @return array The arguments.
     */
    public function getArguments()
    {
        return $this->arguments;
    }

    /**
     * Returns the return value of a function call.
     *
     * @return mixed The return value.
     */
    public function getReturn()
    {
        return $this->return;
    }
    
    /**
     * Returns if the spied function threw an exception.
     *
     * @return bool TRUE if an exception was thrown.
     */
    public function isExceptionThrown()
    {
        return !is_null($this->exception);
    }
    
    /**
     * Return the exception which was thrown by the spied function.
     *
     * @return \Exception|null function's exception or null if none was thrown
     */
    public function getException()
    {
        return $this->exception;
    }
}
