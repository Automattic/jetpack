<?php

namespace phpmock\generator;

/**
 * Builder for the mocked function parameters.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 * @internal
 */
class ParameterBuilder
{

    /**
     * @var string The signature's parameters.
     */
    private $signatureParameters;

    /**
     * @var string The body's parameter access list.
     */
    private $bodyParameters;

    /**
     * Builds the parameters for an existing function.
     *
     * @param string $functionName The function name.
     */
    public function build($functionName)
    {
        if (!function_exists($functionName)) {
            return;
        }
        $function            = new \ReflectionFunction($functionName);
        $signatureParameters = [];
        $bodyParameters      = [];
        foreach ($function->getParameters() as $reflectionParameter) {
            if ($this->isVariadic($reflectionParameter)) {
                break;
            }
            $parameter = $reflectionParameter->isPassedByReference()
                ? "&$$reflectionParameter->name"
                : "$$reflectionParameter->name";
            
            $signatureParameter = $reflectionParameter->isOptional()
                ? sprintf("%s = '%s'", $parameter, MockFunctionGenerator::DEFAULT_ARGUMENT)
                : $parameter;

            $signatureParameters[] = $signatureParameter;
            $bodyParameters[]      = $parameter;
        }
        $this->signatureParameters = implode(", ", $signatureParameters);
        $this->bodyParameters      = implode(", ", $bodyParameters);
    }
    
    /**
     * Returns whether a parameter is variadic.
     *
     * @param \ReflectionParameter $parameter The parameter.
     *
     * @return boolean True, if the parameter is variadic.
     */
    private function isVariadic(\ReflectionParameter $parameter)
    {
        if ($parameter->name == "...") {
            // This is a variadic C-implementation before PHP-5.6.
            return true;
        }
        if (method_exists($parameter, "isVariadic")) {
            return $parameter->isVariadic();
        }
        return false;
    }
    
    /**
     * Returns the signature's parameters.
     *
     * @return string The signature's parameters.
     */
    public function getSignatureParameters()
    {
        return $this->signatureParameters;
    }
    
    /**
     * Returns the body's parameter access list.
     *
     * @return string The body's parameter list.
     */
    public function getBodyParameters()
    {
        return $this->bodyParameters;
    }
}
