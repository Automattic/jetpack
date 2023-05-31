<?php

function DAL_contact_method_mock( $test_case, $method_to_mock ) {
	global $zbs;

	$zbs      = new \stdClass();
	$zbs->DAL = new \stdClass();

	$mock = $test_case->getMockBuilder( \stdClass::class )
	->setMethods( array( $method_to_mock ) )
	->getMock();

	$zbs->DAL->contacts = $mock;
}
