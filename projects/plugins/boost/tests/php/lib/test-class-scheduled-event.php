<?php

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Scheduled_Event;
use Automattic\Jetpack_Boost\Tests\Base_Test_Case;
use Brain\Monkey\Functions;

class Test_Scheduled_Event extends Base_Test_Case {
	public function test_setup() {
		$scheduled_event = new Scheduled_Event();

		Functions\expect( 'add_action' )
			->once()
			->with( 'jetpack_boost_network_cron', array( $scheduled_event, 'execute_network_cron' ), 10, 2 )
			->andReturn( true );

		$result = $scheduled_event->setup();
		$this->assertNull( $result );
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

		Functions\expect( 'update_site_option' )
			->once()
			->with( "{$hook}_network_cron_recurrence", $recurrence )
			->andReturn( true );

		Functions\expect( 'get_site_option' )
			->once()
			->with( "{$hook}_network_cron_blogs_subscribed", array() )
			->andReturn( array() );

		Functions\expect( 'get_current_blog_id' )
			->once()
			->andReturn( 1 );

		Functions\expect( 'update_site_option' )
			->once()
			->with( "{$hook}_network_cron_blogs_subscribed", array( 1 => true ) )
			->andReturn( true );

		Functions\expect( 'wp_schedule_event' )
			->once()
			->with( $timestamp, $recurrence, 'jetpack_boost_network_cron', array( $hook, $args ) )
			->andReturn( true );

		Scheduled_Event::schedule_singleton_network_cron( $timestamp, $recurrence, $hook, $args );
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

		Scheduled_Event::schedule_singleton_network_cron( $timestamp, $recurrence, $hook, $args );
		$this->expectNotToPerformAssertions();
	}

	public function test_unschedule_singleton_network_cron() {
		$hook = 'test_hook';
		$args = array( 'test_arg' => 'value' );

		Functions\expect( 'get_site_option' )
			->once()
			->with( "{$hook}_network_cron_blogs_subscribed", array() )
			->andReturn( array( 1 => true ) );

		Functions\expect( 'get_current_blog_id' )
			->once()
			->andReturn( 1 );

		Functions\expect( 'update_site_option' )
			->once()
			->with( "{$hook}_network_cron_blogs_subscribed", array() )
			->andReturn( true );

		Functions\expect( 'delete_site_option' )
			->once()
			->with( "{$hook}_network_cron_ran" )
			->andReturn( true );

		Functions\expect( 'delete_site_option' )
			->once()
			->with( "{$hook}_network_cron_recurrence" )
			->andReturn( true );

			Functions\expect( 'delete_site_option' )
			->once()
			->with( "{$hook}_network_cron_blogs_subscribed" )
			->andReturn( true );

		Functions\expect( 'wp_clear_scheduled_hook' )
			->once()
			->with( 'jetpack_boost_network_cron', array( $hook, $args ) )
			->andReturn( true );

		Scheduled_Event::unschedule_singleton_network_cron( $hook, $args );
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
			->with( "{$action}_network_cron_recurrence", 'daily' )
			->andReturn( 'daily' );

		Functions\expect( 'get_site_option' )
			->once()
			->with( "{$action}_network_cron_ran", 0 )
			->andReturn( $current_time - 100 );

		Scheduled_Event::execute_network_cron( $action, $args );
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
			->with( "{$action}_network_cron_recurrence", 'daily' )
			->andReturn( 'daily' );

		Functions\expect( 'get_site_option' )
			->once()
			->with( "{$action}_network_cron_ran", 0 )
			->andReturn( $current_time - 90000 ); // Last run was more than a day ago

		Functions\expect( 'update_site_option' )
			->once()
			->with( "{$action}_network_cron_ran", $current_time )
			->andReturn( true );

		Functions\expect( 'do_action' )
			->once()
			->with( $action, 'test_value' );

		Scheduled_Event::execute_network_cron( $action, $args );
		$this->expectNotToPerformAssertions();
	}
}
