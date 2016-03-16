<?php

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once dirname( __FILE__ ) . '/class.json-api-platform-wpcom.php';
} else {
	require_once dirname( __FILE__ ) . '/class.json-api-platform-jetpack.php';
}
