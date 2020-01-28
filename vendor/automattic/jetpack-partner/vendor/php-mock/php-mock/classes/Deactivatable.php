<?php

namespace phpmock;

/**
 * Implementation deactivates related mocks.
 *
 * @author Markus Malkusch <markus@malkusch.de>
 * @link bitcoin:1335STSwu9hST4vcMRppEPgENMHD2r1REK Donations
 * @license http://www.wtfpl.net/txt/copying/ WTFPL
 */
interface Deactivatable
{

    /**
     * Disable related mocks.
     */
    public function disable();
}
