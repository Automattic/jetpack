<?php

namespace Automatic\Jetpack\CRM\Automation\Tests\Mocks;

use Automattic\Jetpack\CRM\Automation\Automation_Recipe;
use Automattic\Jetpack\CRM\Automation\Tests\Event_Emitter;
use Automattic\Jetpack\CRM\Automation\Trigger;

class Contact_Created_Trigger implements Trigger {

	public function get_name(): string {
		return 'contact_created';
	}

	public function get_title(): string {
		return 'Contact Created';
	}

	public function get_description(): ?string {
		return 'Triggered when a contact is created';
	}

	public function get_category(): string {
		return 'contact';
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
