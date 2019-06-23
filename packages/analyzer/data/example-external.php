<?php

/**
 * This file is not meant to be run. It is used as example input to the compatibility checker script
 */

// valid signature initialization with missing class
$sig = new Jetpack_Signature( 'abcd1234', 12345 );

Jetpack_Tracks_Client::record_event( array( '_en' => 'jetpack_sample_event' ) );
