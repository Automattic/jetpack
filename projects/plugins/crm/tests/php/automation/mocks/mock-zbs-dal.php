<?php

function DAL_contact_mock( $object_instance, array $mocked_functions ) {
	global $zbs;

	$zbs                          = new \stdClass();
	$zbs->DAL                     = new \stdClass();
	$zbs->db1CompatabilitySupport = false;

	$mock = $object_instance->getMockBuilder( \stdClass::class )
	->addMethods( $mocked_functions )
	->getMock();

	$zbs->DAL->contacts = $mock;
}

function jpcrm_mock_settings( $test_base_case, $settings ) {
	global $zbs;

	if ( ! $zbs ) {
		$zbs                          = new \stdClass();
		$zbs->db1CompatabilitySupport = false;
	}

	$mock = $test_base_case->getMockBuilder( \stdClass::class )
							->addMethods( array( 'get' ) )
							->getMock();
	$mock->method( 'get' )->will( $test_base_case->returnValueMap( $settings ) );

	$zbs->settings = $mock;
}
