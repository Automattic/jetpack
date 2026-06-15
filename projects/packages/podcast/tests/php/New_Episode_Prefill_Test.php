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
		if ( has_action( 'wp_insert_post', array( New_Episode_Prefill::class, 'assign_category' ) ) ) {
			remove_action( 'wp_insert_post', array( New_Episode_Prefill::class, 'assign_category' ), 10 );
		}
		if ( has_filter( 'default_content', array( New_Episode_Prefill::class, 'prefill_block_content' ) ) ) {
			remove_filter( 'default_content', array( New_Episode_Prefill::class, 'prefill_block_content' ), 10 );
		}
		delete_option( 'podcasting_category_id' );
		$_GET = array();
		$this->reset_prefill_state();
		parent::tearDown();
	}

	public function test_maybe_register_handlers_requires_flagged_post_new_screen_and_configured_category() {
		global $pagenow;
		$pagenow = 'post-new.php';

		$_GET[ New_Episode_Prefill::QUERY_VAR ] = '1';
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

		// WorDBless lacks the term-relationships table; spy on set_object_terms
		// to verify the call instead of reading the assignment back.
		$spy    = array();
		$record = function ( $object_id, $terms, $tt_ids, $taxonomy ) use ( &$spy ) {
			$spy[] = array(
				'object_id' => (int) $object_id,
				'taxonomy'  => $taxonomy,
				'terms'     => array_map( 'intval', (array) $terms ),
			);
		};
		add_action( 'set_object_terms', $record, 10, 4 );

		add_action( 'wp_insert_post', array( New_Episode_Prefill::class, 'assign_category' ), 10, 3 );
		do_action( 'wp_insert_post', $post_id, get_post( $post_id ), false );

		remove_action( 'set_object_terms', $record, 10 );

		$this->assertSame(
			array(
				array(
					'object_id' => (int) $post_id,
					'taxonomy'  => 'category',
					'terms'     => array( (int) $category_id ),
				),
			),
			$spy
		);
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

		// Same set_object_terms spy as above; here we assert no call fires.
		$spy    = array();
		$record = function ( $object_id, $terms, $tt_ids, $taxonomy ) use ( &$spy, $post_id ) {
			if ( (int) $object_id === (int) $post_id && 'category' === $taxonomy ) {
				$spy[] = array_map( 'intval', (array) $terms );
			}
		};
		add_action( 'set_object_terms', $record, 10, 4 );

		New_Episode_Prefill::assign_category( $post_id, get_post( $post_id ), true );
		New_Episode_Prefill::assign_category( $post_id, get_post( $post_id ), false );

		remove_action( 'set_object_terms', $record, 10 );

		$this->assertSame( array(), $spy );

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
		$post    = get_post( $post_id );

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

	private function reset_prefill_state() {
		$property = new \ReflectionProperty( New_Episode_Prefill::class, 'handled_post_id' );
		// setAccessible is required on PHP < 8.1; deprecated but still works on later versions.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, 0 );
	}
}
