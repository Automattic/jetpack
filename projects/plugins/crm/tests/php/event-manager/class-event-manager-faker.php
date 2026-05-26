<?php

namespace Automattic\Jetpack\CRM\Event_Manager\Tests;

use Automattic\Jetpack\CRM\Entities\Contact;
use Automattic\Jetpack\CRM\Entities\Factories\Contact_Factory;
use Automattic\Jetpack\CRM\Entities\Factories\Invoice_Factory;
use Automattic\Jetpack\CRM\Entities\Factories\Transaction_Factory;
use Automattic\Jetpack\CRM\Entities\Invoice;
use Automattic\Jetpack\CRM\Entities\Transaction;

class Event_Manager_Faker {

	private static $instance;

	public static function instance(): Event_Manager_Faker {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	public function contact(): Contact {
		$data = array(
			'id'               => 1,
			'owner'            => '-1',
			'status'           => 'lead',
			'fname'            => 'John',
			'lname'            => 'Doe',
			'email'            => 'johndoe@example.com',
			'prefix'           => 'Mr',
			'addr1'            => 'My Street 1',
			'addr2'            => '',
			'city'             => 'San Francisco',
			'county'           => 'CA',
			'postcode'         => '94110',
			'country'          => 'US',
			'secaddr_addr1'    => '',
			'secaddr_addr2'    => '',
			'secaddr_city'     => '',
			'secaddr_county'   => '',
			'secaddr_country'  => '',
			'secaddr_postcode' => '',
			'hometel'          => '',
			'worktel'          => '',
			'mobtel'           => '(877) 273-3049',
			'wpid'             => '',
			'avatar'           => '',
			'tw'               => '',
			'li'               => '',
			'fb'               => '',
			'created'          => '1691193339',
			'lastupdated'      => '1691193339',
			'lastcontacted'    => '',
			'lastlog'          => '',
			'lastcontactlog'   => '',
			'tags'             => array(
				array(
					'id'          => 1,
					'objtype'     => 1,
					'name'        => 'Name 1',
					'slug'        => 'name-1',
					'created'     => 1692663411,
					'lastupdated' => 1692663411,
				),
				array(
					'id'          => 2,
					'objtype'     => 1,
					'name'        => 'Name 2',
					'slug'        => 'name-2',
					'created'     => 1692663412,
					'lastupdated' => 1692663412,
				),
			),
		);

		return Contact_Factory::create( $data );
	}

	public function invoice(): Invoice {
		$data = array(
			'id'          => 1,
			'id_override' => '1',
			'parent'      => '',
			'status'      => 'Unpaid',
			'due_date'    => 1690840800,
			'hash'        => 'ISSQndSUjlhJ8feWj2v',
			'lineitems'   => array(
				array(
					'net'      => 3.75,
					'desc'     => 'Dummy product',
					'quantity' => '3',
					'price'    => '1.25',
					'total'    => 3.75,
				),
			),
			'contacts'    => array( 1 ),
			'created'     => -1,
		);

		return Invoice_Factory::create( $data );
	}

	public function transaction(): Transaction {
		$data = array(
			'id'             => 1,
			'title'          => 'Some transaction title',
			'desc'           => 'Some desc',
			'hash'           => 'mASOpAnf334Pncl1px4',
			'status'         => 'Completed',
			'type'           => 'Sale',
			'ref'            => '123456',
			'currency'       => 'USD',
			'total'          => '150.00',
			'tax'            => '10.00',
			'lineitems'      => array(),
			'date'           => 1676000000,
			'date_completed' => 1676923766,
			'created'        => 1675000000,
			'lastupdated'    => 1675000000,
			'tags'           => array(
				array(
					'id'          => 1,
					'objtype'     => 1,
					'name'        => 'Name 1',
					'slug'        => 'name-1',
					'created'     => 1692663411,
					'lastupdated' => 1692663411,
				),
				array(
					'id'          => 2,
					'objtype'     => 1,
					'name'        => 'Name 2',
					'slug'        => 'name-2',
					'created'     => 1692663412,
					'lastupdated' => 1692663412,
				),
			),
		);

		return Transaction_Factory::create( $data );
	}
}
