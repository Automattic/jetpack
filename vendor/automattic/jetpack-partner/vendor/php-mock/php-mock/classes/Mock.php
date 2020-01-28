<?php

namespace phpmock;

use phpmock\generator\MockFunctionGenerator;

/**
 * Mocking framework for built-in PHP functions.
 *
 * Mocking a build-in PHP function is achieved by using
 * PHP's namespace fallback policy. A mock will provide the namespaced function.
 * I.e. only unqualified functions in a non-global namespace can be mocked.
 *
 * Example:
 * <code>
 * namespace foo;
 *
 * use phpmock\Mock;
 *
 * $time = new Mock(
 *     __NAMESPACE__,
 *     "time",
 *     function () {
 *         return 3;
 *     }
 * );
 * $time->enable();
 * assert (3 == time());
 *
 * $time->disable();
 * assert (3 != time());
 * </code>
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 * @see MockBuilder
 */
class Mock implements Deactivatable
{

    /**
     * @var string namespace for the mock function.
     */
    private $namespace;
    
    /**
     * @var string function name of the mocked function.
     */
    private $name;
    
    /**
     * @var callable The function mock.
     */
    private $function;
    
    /**
     * Set the namespace, function name and the mock function.
     *
     * @param string   $namespace  The namespace for the mock function.
     * @param string   $name       The function name of the mocked function.
     * @param callable $function   The mock function.
     */
    public function __construct($namespace, $name, callable $function)
    {
        if (empty($namespace)) {
            throw new \InvalidArgumentException("Namespace should not be empty");
        }
        if (empty($name)) {
            throw new \InvalidArgumentException("Function name should not be empty");
        }
        
        $this->namespace = $namespace;
        $this->name      = $name;
        $this->function  = $function;
    }
    
    /**
     * Enables this mock.
     *
     * @throws MockEnabledException If the function has already an enabled mock.
     * @see Mock::disable()
     * @see Mock::disableAll()
     *
     * @SuppressWarnings(PHPMD)
     */
    public function enable()
    {
        $registry = MockRegistry::getInstance();
        if ($registry->isRegistered($this)) {
            throw new MockEnabledException(
                "$this->name is already enabled."
                . "Call disable() on the existing mock."
            );
        }
        $this->define();
        $registry->register($this);
    }

    /**
     * Disable this mock.
     *
     * @see Mock::enable()
     * @see Mock::disableAll()
     */
    public function disable()
    {
        MockRegistry::getInstance()->unregister($this);
    }
    
    /**
     * Disable all mocks.
     *
     * @see Mock::enable()
     * @see Mock::disable()
     */
    public static function disableAll()
    {
        MockRegistry::getInstance()->unregisterAll();
    }
    
    /**
     * Calls the mocked function.
     *
     * This method is called from the namespaced function.
     *
     * @param array $arguments the call arguments.
     * @return mixed
     * @internal
     */
    public function call(array $arguments)
    {
        return call_user_func_array($this->function, $arguments);
    }
    
    /**
     * Returns the fully qualified function name.
     *
     * @return string The function name with its namespace.
     * @internal
     */
    public function getFQFN()
    {
        return strtolower("{$this->getNamespace()}\\$this->name");
    }

    /**
     * Returns the namespace without enclosing slashes.
     *
     * @return string The namespace
     */
    public function getNamespace()
    {
        return trim($this->namespace, "\\");
    }
    
    /**
     * Returns the unqualified function name.
     *
     * @return string The name of the mocked function.
     */
    public function getName()
    {
        return $this->name;
    }
    
    /**
     * Defines the mocked function in the given namespace.
     *
     * In most cases you don't have to call this method. enable() is doing this
     * for you. But if the mock is defined after the first call in the
     * tested class, the tested class doesn't resolve to the mock. This is
     * documented in Bug #68541. You therefore have to define the namespaced
     * function before the first call. Defining the function has no side
     * effects as you still have to enable the mock. If the function was
     * already defined this method does nothing.
     *
     * @see enable()
     * @link https://bugs.php.net/bug.php?id=68541 Bug #68541
     */
    public function define()
    {
        $fqfn = $this->getFQFN();
        if (function_exists($fqfn)) {
            return;
        }
        $functionGenerator = new MockFunctionGenerator($this);
        $functionGenerator->defineFunction();
    }
}
