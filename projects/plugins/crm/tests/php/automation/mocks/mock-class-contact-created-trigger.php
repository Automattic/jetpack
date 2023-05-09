<?php

namespace Automatic\Jetpack\CRM\Automation\Tests\Mocks;

use Automattic\Jetpack\CRM\Automation\Automation_Recipe;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;
use Automattic\Jetpack\CRM\Automation\Tests\Event_Emitter;

class Contact_Created_Trigger extends Base_Trigger {

	public function __construct() {
		$trigger_data = array(
			'name'        => 'contact_created',
			'title'       => 'Contact Created',
			'description' => 'Triggered when a contact is created',
			'category'    => 'contact',
		);
		parent::__construct( $trigger_data );
	}

	public function init( Automation_Recipe $recipe ) {

		$event_emitter = Event_Emitter::instance();

		$event_emitter->on(
			'contact_created',
			function ( $event_data ) use ( $recipe ) {
				$recipe->execute( $this, $event_data );
			}
		);
	}
}
