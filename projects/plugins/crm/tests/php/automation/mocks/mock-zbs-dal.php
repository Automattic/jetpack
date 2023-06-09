<?php

function DAL_contact_mock( $object_instance, array $mocked_functions ) {
	global $zbs;

	$zbs      = new \stdClass();
	$zbs->DAL = new \stdClass();

	$mock = $object_instance->getMockBuilder( \stdClass::class )
	->addMethods( $mocked_functions )
	->getMock();

	$zbs->DAL->contacts = $mock;
}
