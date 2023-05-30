<?php

function DAL_addUpdateContact_mock( $object_instance ) {
	global $zbs;

	$zbs      = new \stdClass();
	$zbs->DAL = new \stdClass();

	$mock = $object_instance->getMockBuilder( \stdClass::class )
	->setMethods( array( 'addUpdateContact' ) )
	->getMock();

	$zbs->DAL->contacts = $mock;
}
