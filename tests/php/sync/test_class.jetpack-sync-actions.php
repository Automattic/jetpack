<?php

use Automattic\Jetpack\Sync\Actions;
use Automattic\Jetpack\Sync\Modules;

class WP_Test_Jetpack_Sync_Actions extends WP_UnitTestCase {
	function test_get_sync_status() {
		$no_checksum = Actions::get_sync_status();
		$this->assertArrayNotHasKey( 'posts_checksum', $no_checksum );
		$this->assertArrayNotHasKey( 'comments_checksum', $no_checksum );
		$this->assertArrayNotHasKey( 'post_meta_checksum', $no_checksum );
		$this->assertArrayNotHasKey( 'comment_meta_checksum', $no_checksum );

		$kitchen_sink_checksum = Actions::get_sync_status(
			'posts_checksum,comments_checksum,post_meta_checksum,comment_meta_checksum'
		);
		$this->assertArrayHasKey( 'posts_checksum', $kitchen_sink_checksum );
		$this->assertArrayHasKey( 'comments_checksum', $kitchen_sink_checksum );
		$this->assertArrayHasKey( 'post_meta_checksum', $kitchen_sink_checksum );
		$this->assertArrayHasKey( 'comment_meta_checksum', $kitchen_sink_checksum );

		$posts = Actions::get_sync_status( 'posts_checksum' );
		$this->assertArrayHasKey( 'posts_checksum', $posts );
		$this->assertArrayNotHasKey( 'comments_checksum', $posts );
		$this->assertArrayNotHasKey( 'post_meta_checksum', $posts );
		$this->assertArrayNotHasKey( 'comment_meta_checksum', $posts );

		$comments = Actions::get_sync_status(
			'comments_checksum'
		);
		$this->assertArrayNotHasKey( 'posts_checksum', $comments );
		$this->assertArrayHasKey( 'comments_checksum', $comments );
		$this->assertArrayNotHasKey( 'post_meta_checksum', $comments );
		$this->assertArrayNotHasKey( 'comment_meta_checksum', $comments );

		$post_meta = Actions::get_sync_status(
			'post_meta_checksum'
		);
		$this->assertArrayNotHasKey( 'posts_checksum', $post_meta );
		$this->assertArrayNotHasKey( 'comments_checksum', $post_meta );
		$this->assertArrayHasKey( 'post_meta_checksum', $post_meta );
		$this->assertArrayNotHasKey( 'comment_meta_checksum', $post_meta );

		$comment_meta = Actions::get_sync_status(
			'comment_meta_checksum'
		);
		$this->assertArrayNotHasKey( 'posts_checksum', $comment_meta );
		$this->assertArrayNotHasKey( 'comments_checksum', $comment_meta );
		$this->assertArrayNotHasKey( 'post_meta_checksum', $comment_meta );
		$this->assertArrayHasKey( 'comment_meta_checksum', $comment_meta );
	}

	function test_do_initial_sync_during_full_sync() {
		$full_sync = Modules::get_module( 'full-sync' );
		$full_sync->start();

		$initial_sync = Actions::do_initial_sync();

		$this->assertFalse( $initial_sync );

		$full_sync->reset_data();
	}

	function test_do_initial_sync_during_no_sync() {
		$initial_sync = Actions::do_initial_sync();

		$this->assertNull( $initial_sync );
	}
}
