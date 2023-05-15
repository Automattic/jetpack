<?php

namespace Automattic\Jetpack\CRM\Automation\Triggers;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;

class Contact_Updated extends Base_Trigger {
	
	private $contact_before_update = array();
	
	public function __construct() {
		$trigger_data = array(
			'name'        => 'contact_updated',
			'title'       => 'Contact Updated',
			'description' => 'Triggered when a CRM contact is updated',
			'category'    => 'contact',
		);
		
		parent::__construct( $trigger_data );
	}

	/**
	 * Init the trigger. Listen to the desired event
	 *
	 * @param Automation_Workflow $workflow The workflow to which the trigger belongs.
	 * @throws Automation_Exception
	 */
	public function init( Automation_Workflow $workflow ) {
		add_action( 'jpcrm_after_contact_update', function( $contact_id, $contact_data ) use ( $workflow ) {
			$workflow->execute( $this, $contact_data );
		}, 10, 2 );
	}
}