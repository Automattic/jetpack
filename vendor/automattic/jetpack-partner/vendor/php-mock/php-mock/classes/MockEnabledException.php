<?php

namespace phpmock;

/**
 * Exception when enabling a mock for an already mocked function.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 * @see Mock::enable()
 */
class MockEnabledException extends \Exception
{
    
    /**
     * Sets the message.
     *
     * @param string $message Exception message.
     */
    public function __construct($message)
    {
        parent::__construct($message);
    }
}
