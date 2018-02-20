<?php

/**
 * This code is used by the test test_register_post_types_callback_error() present in the file tests/php/sync/test_class.jetpack-sync-callables.php
 * This test attempts to sync an anonymous callable but anonymous functions are not present in PHP 5.2 which we still support.
 * So, this file is conditionally included by that test if being run on PHP >=5.4
 */
register_post_type( 'testing', array( 'register_meta_box_cb' => function() {} ) );

