<?php
/**
 * Phan config.
 *
 * @package automattic/e2e-common
 */

// Require base config.
require dirname( __DIR__, 3 ) . '/.phan/config.base.php';

return make_phan_config( dirname( __DIR__ ) );
