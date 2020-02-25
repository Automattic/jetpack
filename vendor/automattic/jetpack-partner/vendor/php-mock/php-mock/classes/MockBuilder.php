<?php

namespace phpmock;

use phpmock\functions\FunctionProvider;

/**
 * Fluent API mock builder.
 *
 * Example:
 * <code>
 * namespace foo;
 *
 * use phpmock\MockBuilder;
 * use phpmock\functions\FixedValueFunction;
 *
 * $builder = new MockBuilder();
 * $builder->setNamespace(__NAMESPACE__)
 *         ->setName("time")
 *         ->setFunctionProvider(new FixedValueFunction(1417011228));
 *
 * $mock = $builder->build();
 *
 * // The mock is not enabled yet.
 * assert (time() != 1417011228);
 *
 * $mock->enable();
 * assert (time() == 1417011228);
 *
 * // The mock is disabled and PHP's built-in time() is called.
 * $mock->disable();
 * assert (time() != 1417011228);
 * </code>
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 * @see Mock
 */
class MockBuilder
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
     * Sets the mock namespace.
     *
     * @param string $namespace The function namespace.
     * @return MockBuilder
     */
    public function setNamespace($namespace)
    {
        $this->namespace = $namespace;
        return $this;
    }
    
    /**
     * Sets the mocked function name.
     *
     * @param string $name The function name.
     * @return MockBuilder
     */
    public function setName($name)
    {
        $this->name = $name;
        return $this;
    }
    
    /**
     * Sets the mock function.
     *
     * Use this method if you want to set the mocked behaviour with
     * a callable. Alternatively, you can use {@link setFunctionProvider()}
     * to set it with a {@link FunctionProvider}.
     *
     * @param callable $function The mock function.
     * @return MockBuilder
     * @see setFunctionProvider()
     */
    public function setFunction(callable $function)
    {
        $this->function = $function;
        return $this;
    }
    
    /**
     * Sets the mock function.
     *
     * Use this method if you want to set the mocked behaviour with
     * a {@link FunctionProvider}. Alternatively, you can use
     * {@link setFunction()} to set it with a callable.
     *
     * @param FunctionProvider $provider The mock function provider.
     * @return MockBuilder
     * @see setFunction()
     */
    public function setFunctionProvider(FunctionProvider $provider)
    {
        return $this->setFunction($provider->getCallable());
    }
    
    /**
     * Builds a mock.
     *
     * @return Mock The mock.
     */
    public function build()
    {
        return new Mock($this->namespace, $this->name, $this->function);
    }
}
