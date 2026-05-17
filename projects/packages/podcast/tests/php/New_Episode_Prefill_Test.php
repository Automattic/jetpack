<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\New_Episode_Prefill;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Podcast\New_Episode_Prefill
 */
#[CoversClass( New_Episode_Prefill::class )]
class New_Episode_Prefill_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();
		$this->reset_prefill_state();
	}

	protected function tearDown(): void {
		remove_action( 'wp_insert_post', array( New_Episode_Prefill::class, 'assign_category' ), 10 );
		remove_filter( 'default_content', array( New_Episode_Prefill::class, 'prefill_block_content' ), 10 );
		delete_option( 'podcasting_category_id' );
		unset( $_GET[ New_Episode_Prefill::QUERY_VAR ] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$this->reset_prefill_state();
		parent::tearDown();
	}

	public function test_maybe_register_handlers_requires_flagged_post_new_screen_and_configured_category() {
		global $pagenow;
		$pagenow = 'post-new.php';

		$_GET[ New_Episode_Prefill::QUERY_VAR ] = '1'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		New_Episode_Prefill::maybe_register_handlers();

		$this->assertFalse( has_action( 'wp_insert_post', array( New_Episode_Prefill::class, 'assign_category' ) ) );

		update_option( 'podcasting_category_id', 123 );
		New_Episode_Prefill::maybe_register_handlers();

		$this->assertSame( 10, has_action( 'wp_insert_post', array( New_Episode_Prefill::class, 'assign_category' ) ) );
		$this->assertFalse( has_filter( 'default_content', array( New_Episode_Prefill::class, 'prefill_block_content' ) ) );
	}

	public function test_assign_category_sets_configured_category_for_initial_auto_draft() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'prefill-author',
				'user_pass'  => 'pass',
				'user_email' => 'prefill-author@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		$category_id = wp_create_category( 'Podcast Category' );
		update_option( 'podcasting_category_id', $category_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Auto Draft',
				'post_type'   => 'post',
				'post_status' => 'auto-draft',
			)
		);

		add_action( 'wp_insert_post', array( New_Episode_Prefill::class, 'assign_category' ), 10, 3 );
		New_Episode_Prefill::assign_category( $post_id, get_post( $post_id ), false );

		$this->assertSame( array( $category_id ), wp_get_post_categories( $post_id ) );
		$this->assertFalse( has_action( 'wp_insert_post', array( New_Episode_Prefill::class, 'assign_category' ) ) );

		wp_delete_post( $post_id, true );
		wp_delete_user( $user_id );
		wp_delete_category( $category_id );
	}

	public function test_assign_category_does_not_override_updates_or_non_auto_drafts() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'prefill-updater',
				'user_pass'  => 'pass',
				'user_email' => 'prefill-updater@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		$current_category = wp_create_category( 'Current Category' );
		$podcast_category = wp_create_category( 'Podcast Category' );
		update_option( 'podcasting_category_id', $podcast_category );

		$post_id = wp_insert_post(
			array(
				'post_title'    => 'Draft',
				'post_type'     => 'post',
				'post_status'   => 'draft',
				'post_category' => array( $current_category ),
			)
		);

		New_Episode_Prefill::assign_category( $post_id, get_post( $post_id ), true );
		New_Episode_Prefill::assign_category( $post_id, get_post( $post_id ), false );

		$this->assertSame( array( $current_category ), wp_get_post_categories( $post_id ) );

		wp_delete_post( $post_id, true );
		wp_delete_user( $user_id );
		wp_delete_category( $current_category );
		wp_delete_category( $podcast_category );
	}

	public function test_prefill_block_content_only_inserts_for_empty_post_content() {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Auto Draft',
				'post_type'   => 'post',
				'post_status' => 'auto-draft',
			)
		);
		$post = get_post( $post_id );

		$this->assertSame(
			'Already set',
			New_Episode_Prefill::prefill_block_content( 'Already set', $post )
		);

		$this->assertSame(
			"<!-- wp:jetpack/podcast-episode /-->\n",
			New_Episode_Prefill::prefill_block_content( '', $post )
		);

		wp_delete_post( $post_id, true );
	}

	/**
	 * Reset static state shared across tests.
	 */
	private function reset_prefill_state() {
		$property = new \ReflectionProperty( New_Episode_Prefill::class, 'handled_post_id' );
		$property->setAccessible( true );
		$property->setValue( 0 );
	}
}
