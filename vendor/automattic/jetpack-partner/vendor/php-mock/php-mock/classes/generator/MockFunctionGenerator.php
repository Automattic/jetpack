<?php

namespace phpmock\generator;

use phpmock\Mock;
use phpmock\MockRegistry;

/**
 * Generates the mock function.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 * @internal
 */
class MockFunctionGenerator
{
    
    /**
     * @var string The internal name for optional parameters.
     */
    const DEFAULT_ARGUMENT = "optionalParameter";
 
    /**
     * @var Mock The mock.
     */
    private $mock;
    
    /**
     * @var \Text_Template The function template.
     */
    private $template;
    
    /**
     * Sets the mock.
     *
     * @param Mock $mock The mock.
     */
    public function __construct(Mock $mock)
    {
        $this->mock     = $mock;
        $this->template = new \Text_Template(__DIR__ . "/function.tpl");
    }
    
    /**
     * Defines the mock function.
     *
     * @SuppressWarnings(PHPMD)
     */
    public function defineFunction()
    {
        $name = $this->mock->getName();

        $parameterBuilder = new ParameterBuilder();
        $parameterBuilder->build($name);

        $data = [
            "namespace" => $this->mock->getNamespace(),
            "name"      => $name,
            "fqfn"      => $this->mock->getFQFN(),
            "signatureParameters"   => $parameterBuilder->getSignatureParameters(),
            "bodyParameters"        => $parameterBuilder->getBodyParameters(),
        ];
        $this->template->setVar($data, false);
        $definition = $this->template->render();

        eval($definition);
    }
    
    /**
     * Removes optional arguments.
     *
     * @param array $arguments The arguments.
     */
    public static function removeDefaultArguments(&$arguments)
    {
        foreach ($arguments as $key => $argument) {
            if ($argument === self::DEFAULT_ARGUMENT) {
                unset($arguments[$key]);
            }
        }
    }
    
    /**
     * Calls the enabled mock, or the built-in function otherwise.
     *
     * @param string $functionName The function name.
     * @param string $fqfn         The fully qualified function name.
     * @param array  $arguments    The arguments.
     *
     * @return mixed The result of the called function.
     * @see Mock::define()
     * @SuppressWarnings(PHPMD)
     */
    public static function call($functionName, $fqfn, &$arguments)
    {
        $registry = MockRegistry::getInstance();
        $mock     = $registry->getMock($fqfn);

        self::removeDefaultArguments($arguments);

        if (empty($mock)) {
            // call the built-in function if the mock was not enabled.
            return call_user_func_array($functionName, $arguments);
        } else {
            // call the mock function.
            return $mock->call($arguments);
        }
    }
}
