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
		if ( $contact_data['id'] > 0 ) {
			$this->contacts[ $contact_data['id'] ] = $contact_data;
		} else {
			$contact_data['id'] = 2;
			$this->contacts[2]  = $contact_data;
		}
	}

	public function addUpdateContactTags( $contact_data ) {
		$this->contacts[ $contact_data['tags'] ] = $contact_data;
	}

	public function zeroBS_addUpdateObjLog( $contact_data ) {
		$this->contacts[ $contact_data['logs'] ] = $contact_data;
	}

	public function deleteContact( $args = array() ) {
		unset( $this->contacts[ $args['id'] ] );
	}
}
