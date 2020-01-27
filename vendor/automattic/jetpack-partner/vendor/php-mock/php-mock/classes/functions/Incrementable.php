<?php

namespace phpmock\functions;

/**
 * Incrementable allows incrementing a value.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 */
interface Incrementable
{

    /**
     * Increments a value.
     *
     * @param mixed $increment The amount of increase.
     * @internal
     */
    public function increment($increment);
}
