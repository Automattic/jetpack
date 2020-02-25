<?php

namespace phpmock\functions;

/**
 * Converts PHP's microtime string format into a float and vice versa.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 * @internal
 */
class MicrotimeConverter
{
    
    /**
     * Converts a string microtime into a float.
     *
     * @param string $microtime The microtime.
     * @return float The microtime as float.
     */
    public function convertStringToFloat($microtime)
    {
        /*
         * This is from the manual:
         * http://php.net/manual/en/function.microtime.php
         */
        // list($usec, $sec) = explode(" ", $microtime);
        
        // This seems to be more intuitive as an inverse function.
        list($usec, $sec) = sscanf($microtime, "%f %d");
        
        return ((float)$usec + (float)$sec);
    }
    
    /**
     * Converts a float microtime in PHP's microtime() string format.
     *
     * @param float $microtime The microtime.
     * @return string The microtime as string.
     */
    public function convertFloatToString($microtime)
    {
        return sprintf("%0.8F %d", fmod($microtime, 1), $microtime);
    }
}
