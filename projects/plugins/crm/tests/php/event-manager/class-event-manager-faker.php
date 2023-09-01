<?php

namespace Automattic\Jetpack\CRM\Event_Manager\Tests;

class Event_Manager_Faker {

	private static $instance;

	public static function instance(): Event_Manager_Faker {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	public function contact_data() {
		return array(
			'id'          => 1,
			'status'      => 'Lead',
			'name'        => 'John Doe',
			'email'       => 'johndoe@example.com',
			'lastupdated' => 1690385165,
		);
	}
}
