<?php
/**
 * Phan config.
 *
 * @package automattic/jetpack-monorepo
 */

// Require base config.
require dirname( __DIR__, 5 ) . '/.phan/config.base.php';

return make_phan_config( dirname( __DIR__ ), array( 'stubs' => array() ) );
