<?php

namespace phpmock\functions;

/**
 * Provides a callable for a mock function.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 * @see phpmock\MockBuilder::setFunctionProvider()
 */
interface FunctionProvider
{

    /**
     * Returns this object as a callable for the mock function.
     *
     * @return callable The callable for this object.
     */
    public function getCallable();
}
