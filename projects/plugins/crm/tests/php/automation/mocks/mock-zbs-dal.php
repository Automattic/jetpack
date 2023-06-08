<?php

function DAL_contact_mock( $object_instance, $mocked_function ) {
	global $zbs;

	$zbs      = new \stdClass();
	$zbs->DAL = new \stdClass();

	$mock = $object_instance->getMockBuilder( \stdClass::class )
	->addMethods( array( $mocked_function ) )
	->getMock();

	$zbs->DAL->contacts = $mock;
}
