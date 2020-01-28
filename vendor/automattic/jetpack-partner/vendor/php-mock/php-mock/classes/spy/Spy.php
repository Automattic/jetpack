<?php

namespace phpmock\spy;

use phpmock\Mock;

/**
 * A spy records the arguments and results of function calls.
 *
 * If you create a Spy without a mock function, it will use the existing
 * function.
 *
 * Example:
 * <code>
 * namespace foo;
 *
 * use phpmock\spy\Spy;
 *
 * function bar($min, $max) {
 *     return rand($min, $max) + 3;
 * }
 *
 * $spy = new Spy(__NAMESPACE__, "rand");
 * $spy->enable();
 *
 * $result = bar(1, 2);
 *
 * assert ([1, 2]  == $spy->getInvocations()[0]->getArguments());
 * assert ($result == $spy->getInvocations()[0]->getReturn() + 3);
 * </code>
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 */
class Spy extends Mock
{

    /**
     * @var Invocation[] The recorded calls.
     */
    private $invocations = [];
    
    /**
     * Initializes the spy.
     *
     * If no function is specified it will use the existing function.
     *
     * @param string        $namespace The namespace for the mock function.
     * @param string        $name      The function name of the mocked function.
     * @param callable|null $function  The mock function, or null for using the existing function.
     */
    public function __construct($namespace, $name, callable $function = null)
    {
        parent::__construct($namespace, $name, $function ?: $name);
    }
    
    public function call(array $arguments)
    {
        $return = null;
        $exception = null;
        try {
            $return = parent::call($arguments);
            return $return;
        } catch (\Exception $e) {
            $exception = $e;
            throw $e;
        } finally {
            $this->invocations[] = new Invocation($arguments, $return, $exception);
        }
    }
    
    /**
     * Returns the recorded function calls and its arguments.
     *
     * @return Invocation[] The recorded function arguments.
     */
    public function getInvocations()
    {
        return $this->invocations;
    }
}
