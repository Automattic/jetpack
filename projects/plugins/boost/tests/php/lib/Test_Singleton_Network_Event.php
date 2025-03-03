<?php

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Singleton_Network_Event;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;

class Test_Singleton_Network_Event extends Base_TestCase {
	public function test_setup() {
		define( 'DAY_IN_SECONDS', 86400 );

		$scheduled_event = new Singleton_Network_Event();

		Functions\expect( 'add_action' )
			->once()
			->with( 'jetpack_boost_network_cron', array( $scheduled_event, 'execute' ), 10, 2 )
			->andReturn( true );

		Functions\expect( 'add_filter' )
			->once()
			->with( 'pre_get_ready_cron_jobs', array( $scheduled_event, 'filter_cron_jobs' ) )
			->andReturn( true );

		$result = $scheduled_event->setup();
		$this->assertNull( $result );
	}

	public function test_filter_cron_jobs_empty() {
		$scheduled_event = new Singleton_Network_Event();

		Functions\expect( 'wp_get_ready_cron_jobs' )
			->once()
			->andReturn( array() );

		$result = $scheduled_event->filter_cron_jobs( array() );
		$this->assertEquals( array(), $result );
	}

	public function test_filter_cron_jobs_no_network_crons() {
		$scheduled_event = new Singleton_Network_Event();
		$crons           = array(
			time() => array(
				'some_hook' => array(
					'40cd750bba9870f18aada2478b24840a' => array(
						'schedule' => 'daily',
						'args'     => array(),
						'interval' => 86400,
					),
				),
			),
		);

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_TO_EXECUTE, array() )
			->andReturn( array() );

		$result = $scheduled_event->filter_cron_jobs( $crons );
		$this->assertEquals( $crons, $result );
	}

	public function test_filter_cron_jobs_with_network_crons_future() {
		$scheduled_event = new Singleton_Network_Event();
		$now             = time();
		$hook            = 'test_hook';
		$future_time     = $now + 3600;
		$blog_time       = $now + 1800;

		$crons = array(
			$blog_time => array(
				$hook => array(
					'40cd750bba9870f18aada2478b24840a' => array(
						'schedule' => 'daily',
						'args'     => array(),
						'interval' => 86400,
					),
				),
			),
		);

		$crons_to_execute = array(
			$hook => $future_time,
		);

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_TO_EXECUTE, array() )
			->andReturn( $crons_to_execute );

		Functions\expect( 'wp_unschedule_event' )
			->once()
			->with( $blog_time, $hook, array() )
			->andReturn( true );

		Functions\expect( 'wp_schedule_event' )
			->once()
			->with( $future_time, 'daily', $hook, array() )
			->andReturn( true );

		$result = $scheduled_event->filter_cron_jobs( $crons );
		$this->assertEquals( array(), $result );
	}

	public function test_filter_cron_jobs_with_network_crons_past() {
		$scheduled_event = new Singleton_Network_Event();
		$now             = time();
		$hook            = 'test_hook';
		$past_time       = $now - 3600;
		$blog_time       = $now + 1800;

		$crons = array(
			$blog_time => array(
				$hook => array(
					'40cd750bba9870f18aada2478b24840a' => array(
						'schedule' => 'daily',
						'args'     => array(),
						'interval' => 86400,
					),
				),
			),
		);

		$crons_to_execute = array(
			$hook => $past_time,
		);

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_TO_EXECUTE, array() )
			->andReturn( $crons_to_execute );

		Functions\expect( 'update_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_TO_EXECUTE, array( $hook => $now + 86400 ) )
			->andReturn( true );

		$result = $scheduled_event->filter_cron_jobs( $crons );
		$this->assertEquals( $crons, $result );
	}

	public function test_set_cron_to_execute() {
		$hook      = 'test_hook';
		$timestamp = time();

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_TO_EXECUTE, array() )
			->andReturn( array() );

		Functions\expect( 'update_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_TO_EXECUTE, array( $hook => $timestamp ) )
			->andReturn( true );

		$result = Singleton_Network_Event::set_cron_to_execute( $hook, $timestamp );
		$this->assertTrue( $result );
	}

	public function test_schedule_with_new_schedule() {
		$timestamp  = time();
		$recurrence = 'daily';
		$hook       = 'test_hook';
		$args       = array( 'test_arg' => 'value' );

		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( $recurrence, $args )
			->andReturn( false );

		Functions\expect( 'get_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_TO_EXECUTE, array() )
			->andReturn( array() );

		Functions\expect( 'update_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_TO_EXECUTE, array( $hook => $timestamp ) )
			->andReturn( true );

		Functions\expect( 'wp_schedule_event' )
			->once()
			->with( $timestamp, $recurrence, $hook, $args )
			->andReturn( true );

		$result = Singleton_Network_Event::schedule( $timestamp, $recurrence, $hook, $args );
		$this->assertTrue( $result );
	}

	public function test_schedule_already_scheduled() {
		$timestamp  = time();
		$recurrence = 'daily';
		$hook       = 'test_hook';
		$args       = array( 'test_arg' => 'value' );

		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( $recurrence, $args )
			->andReturn( $timestamp );

		$result = Singleton_Network_Event::schedule( $timestamp, $recurrence, $hook, $args );
		$this->assertFalse( $result );
	}

	public function test_unschedule() {
		$hook = 'test_hook';
		$args = array( 'test_arg' => 'value' );

		Functions\expect( 'wp_clear_scheduled_hook' )
			->once()
			->with( 'jetpack_boost_network_cron', array( $hook, $args ) )
			->andReturn( true );

		Singleton_Network_Event::unschedule( $hook, $args );
		$this->expectNotToPerformAssertions();
	}

	public function test_clean_up() {
		Functions\expect( 'delete_site_option' )
			->once()
			->with( Singleton_Network_Event::OPTION_CRON_TO_EXECUTE )
			->andReturn( true );

		Singleton_Network_Event::clean_up();
		$this->expectNotToPerformAssertions();
	}
}
