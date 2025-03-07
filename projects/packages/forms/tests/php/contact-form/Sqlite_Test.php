<?php

namespace Automattic\Jetpack\Forms\ContactForm;

use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;
/**
 * Test class to test the tests.
 */
class Sqlite_Test extends BaseTestCase {
	private static $p1;
	private static $p2;
	private static $r1;
	private static $r2;
	private $server;
	private $plugin;

	public function set_up() {
		parent::set_up();
		global $wp_rest_server;

		$this->plugin = Contact_Form_Plugin::init();

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		do_action( 'rest_api_init' );

		self::$p1 = wp_insert_post(
			array(
				'post_title'   => 'Contact',
				'post_content' => 'a',
				'post_status'  => 'publish',
				// 'post_author'  => $author_id,
			)
		);
		self::$p2 = wp_insert_post(
			array(
				'post_title'   => 'RSVP',
				'post_content' => 'b',
				'post_status'  => 'publish',
				// 'post_author'  => $author_id,
			)
		);
		// Add some responses.
		self::$r1 = wp_insert_post(
			array(
				'post_title'   => 'Feedback from Contact',
				'post_status'  => 'publish',
				'post_content' => 'a',
				'post_parent'  => self::$p1,
				// 'post_author'  => $author_id,
				'post_type'    => 'feedback',
				// 'post_date_gmt' => '1987-01-01 12:00:00',
			)
		);
		self::$r2 = wp_insert_post(
			array(
				'post_title'   => 'Feedback from RSVP',
				'post_status'  => 'publish',
				'post_content' => 'a',
				'post_parent'  => self::$p2,
				// 'post_author'  => $author_id,
				'post_type'    => 'feedback',
				// 'post_date_gmt' => '1987-01-01 12:00:00',
			)
		);
	}

	public function tear_down() {
		wp_delete_post( self::$p1, true );
		wp_delete_post( self::$p2, true );
		wp_delete_post( self::$r1, true );
		wp_delete_post( self::$r2, true );
	}

	public function test_get_feedbacks_filters_returns_200() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/feedback/filters' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		var_dump( $data );
	}
}
