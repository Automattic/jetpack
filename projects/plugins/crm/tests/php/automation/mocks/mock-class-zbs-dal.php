<?php
namespace Automattic\Jetpack\CRM\Automation\Tests\Mocks;

global $zbs;

$zbs      = new \stdClass();
$zbs->DAL = new \stdClass();

class DAL_Contacts {

	private $contacts = array();

	public function getContact( $id ) {
		return $this->contacts[ $id ];
	}

	public function addUpdateContact( $contact_data ) {
		$this->contacts[ $contact_data['id'] ] = $contact_data;
	}

	public function deleteContact( $args = array() ) {
		unset( $this->contacts[ $args['id'] ] );
	}
}
