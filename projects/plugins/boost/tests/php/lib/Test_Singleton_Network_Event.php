<?php

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Singleton_Network_Event;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;

class Test_Singleton_Network_Event extends Base_TestCase {
	public function test_setup() {
		$scheduled_event = new Singleton_Network_Event();

		Functions\expect( 'add_action' )
			->once()
			->with( 'jetpack_boost_network_cron', array( $scheduled_event, 'execute' ), 10, 2 )
			->andReturn( true );

		$result = $scheduled_event->setup();
		$this->assertNull( $result );
	}

	public function test_get_cron_executed() {
		$hook      = 'test_hook';
		$timestamp = time();

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_EXECUTED, array() )
			->andReturn( array( $hook => $timestamp ) );

		$result = Singleton_Network_Event::get_cron_executed( $hook );
		$this->assertEquals( $timestamp, $result );
	}

	public function test_get_cron_executed_default() {
		$hook = 'test_hook';

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_EXECUTED, array() )
			->andReturn( array() );

		$result = Singleton_Network_Event::get_cron_executed( $hook );
		$this->assertSame( 0, $result );
	}

	public function test_get_cron_recurrence() {
		$hook       = 'test_hook';
		$recurrence = 'hourly';

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_RECURRENCE, array() )
			->andReturn( array( $hook => $recurrence ) );

		$result = Singleton_Network_Event::get_cron_recurrence( $hook );
		$this->assertEquals( $recurrence, $result );
	}

	public function test_get_cron_recurrence_default() {
		$hook = 'test_hook';

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_RECURRENCE, array() )
			->andReturn( array() );

		$result = Singleton_Network_Event::get_cron_recurrence( $hook );
		$this->assertEquals( 'daily', $result );
	}

	public function test_get_cron_recurrence_interval() {
		$hook       = 'test_hook';
		$recurrence = 'hourly';

		Functions\expect( 'wp_get_schedules' )
			->once()
			->andReturn(
				array(
					'hourly' => array(
						'interval' => 3600,
						'display'  => 'Once Hourly',
					),
				)
			);

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_RECURRENCE, array() )
			->andReturn( array( $hook => $recurrence ) );

		$result = Singleton_Network_Event::get_cron_recurrence_interval( $hook );
		$this->assertEquals( 3600, $result );
	}

	public function test_set_cron_executed() {
		$hook      = 'test_hook';
		$timestamp = time();

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_EXECUTED, array() )
			->andReturn( array() );

		Functions\expect( 'update_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_EXECUTED, array( $hook => $timestamp ) )
			->andReturn( true );

		$result = Singleton_Network_Event::set_cron_executed( $hook, $timestamp );
		$this->assertTrue( $result );
	}

	public function test_schedule_singleton_network_cron() {
		$timestamp  = time();
		$recurrence = 'daily';
		$hook       = 'test_hook';
		$args       = array( 'test_arg' => 'value' );

		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'jetpack_boost_network_cron', array( $hook, $args ) )
			->andReturn( false );

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_RECURRENCE, array() )
			->andReturn( array() );

		Functions\expect( 'wp_get_schedules' )
			->once()
			->andReturn(
				array(
					'daily' => array(
						'interval' => 86400,
						'display'  => 'Once Daily',
					),
				)
			);

		Functions\expect( 'update_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_RECURRENCE, array( $hook => $recurrence ) )
			->andReturn( true );

		Functions\expect( 'wp_schedule_event' )
			->once()
			->with( $timestamp, $recurrence, 'jetpack_boost_network_cron', array( $hook, $args ) )
			->andReturn( true );

		Singleton_Network_Event::schedule( $timestamp, $recurrence, $hook, $args );
		$this->expectNotToPerformAssertions();
	}

	public function test_schedule_singleton_network_cron_already_scheduled() {
		$timestamp  = time();
		$recurrence = 'daily';
		$hook       = 'test_hook';
		$args       = array( 'test_arg' => 'value' );

		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'jetpack_boost_network_cron', array( $hook, $args ) )
			->andReturn( $timestamp );

		Singleton_Network_Event::schedule( $timestamp, $recurrence, $hook, $args );
		$this->expectNotToPerformAssertions();
	}

	public function test_unschedule_singleton_network_cron() {
		$hook = 'test_hook';
		$args = array( 'test_arg' => 'value' );

		Functions\expect( 'wp_clear_scheduled_hook' )
			->once()
			->with( 'jetpack_boost_network_cron', array( $hook, $args ) )
			->andReturn( true );

		Singleton_Network_Event::unschedule( $hook, $args );
		$this->expectNotToPerformAssertions();
	}

	public function test_unschedule_all() {
		Functions\expect( 'wp_unschedule_hook' )
			->once()
			->with( 'jetpack_boost_network_cron' )
			->andReturn( true );

		Functions\expect( 'delete_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_EXECUTED )
			->andReturn( true );

		Functions\expect( 'delete_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_RECURRENCE )
			->andReturn( true );

		Singleton_Network_Event::unschedule_all();
		$this->expectNotToPerformAssertions();
	}

	public function test_execute_network_cron_when_not_due() {
		$action       = 'test_action';
		$args         = array( 'test_arg' => 'value' );
		$current_time = time();

		Functions\expect( 'wp_get_schedules' )->andReturn(
			array(
				'daily' => array(
					'interval' => 86400,
					'display'  => 'Once Daily',
				),
			)
		);

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_RECURRENCE, array() )
			->andReturn( array( $action => 'daily' ) );

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_EXECUTED, array() )
			->andReturn( array( $action => $current_time - 100 ) );

		Singleton_Network_Event::execute( $action, $args );
		$this->expectNotToPerformAssertions();
	}

	public function test_execute_network_cron_when_due() {
		$action       = 'test_action';
		$args         = array( 'test_value' );
		$current_time = time();

		Functions\expect( 'wp_get_schedules' )->andReturn(
			array(
				'daily' => array(
					'interval' => 86400,
					'display'  => 'Once Daily',
				),
			)
		);

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_RECURRENCE, array() )
			->andReturn( array( $action => 'daily' ) );

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_EXECUTED, array() )
			->andReturn( array( $action => $current_time - 90000 ) ); // Last run was more than a day ago

		Functions\expect( 'get_site_option' )
			->once()
			->withAnyArgs()
			->andReturn( array() );

		Functions\expect( 'update_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_EXECUTED, array( $action => $current_time ) )
			->andReturn( true );

		Functions\expect( 'do_action' )
			->once()
			->with( $action, 'test_value' );

		Singleton_Network_Event::execute( $action, $args );
		$this->expectNotToPerformAssertions();
	}
}
