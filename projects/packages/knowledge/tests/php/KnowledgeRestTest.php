<?php
/**
 * Knowledge storage and REST behavior.
 *
 * @package automattic/jetpack-knowledge
 */

/**
 * Verify permissions and the upstream data contract.
 */
class KnowledgeRestTest extends KnowledgeTestCase {
	public function test_registration_contract() {
		$type = get_post_type_object( 'wp_knowledge' );
		$this->assertFalse( $type->public );
		$this->assertFalse( $type->show_ui );
		$this->assertSame( 'knowledge', $type->rest_base );
		$this->assertSame( 'read_knowledge_items', $type->cap->read );
		$this->assertTrue( taxonomy_exists( 'wp_knowledge_type' ) );
		$this->assertTrue( post_type_supports( 'wp_knowledge', 'revisions' ) );
		$this->assertFalse( post_type_supports( 'wp_knowledge', 'autosave' ) );
		$this->assertFalse( post_type_exists( 'wp_guideline' ) );
	}

	public function test_anonymous_and_subscriber_cannot_read_published_knowledge() {
		wp_insert_post(
			array(
				'post_type'   => 'wp_knowledge',
				'post_status' => 'publish',
				'post_title'  => 'Site knowledge',
			)
		);
		$this->assertSame( 401, $this->request( 'GET' )->get_status() );
		wp_set_current_user( $this->user( 'subscriber' ) );
		$this->assertSame( 403, $this->request( 'GET' )->get_status() );
		$this->assertSame( 403, $this->request( 'GET', '/wp/v2/knowledge/guideline-scopes' )->get_status() );
	}

	public function test_contributor_defaults_to_private_note() {
		wp_set_current_user( $this->user( 'contributor' ) );
		$response = $this->request(
			'POST',
			'/wp/v2/knowledge',
			array(
				'title'   => 'My note',
				'content' => 'Private content',
			)
		);
		$this->assertSame( 201, $response->get_status() );
		$post = get_post( $response->get_data()['id'] );
		$this->assertSame( 'private', $post->post_status );
		$this->assertSame( array( 'note' ), wp_get_object_terms( $post->ID, 'wp_knowledge_type', array( 'fields' => 'slugs' ) ) );
	}

	public function test_contributor_cannot_publish_or_read_another_users_private_record() {
		$owner = $this->user( 'contributor' );
		$id    = wp_insert_post(
			array(
				'post_type'   => 'wp_knowledge',
				'post_status' => 'private',
				'post_author' => $owner,
				'post_title'  => 'Private note',
			)
		);
		wp_set_current_user( $this->user( 'contributor' ) );
		$this->assertSame(
			403,
			$this->request(
				'POST',
				'/wp/v2/knowledge',
				array(
					'title'  => 'Published note',
					'status' => 'publish',
				)
			)->get_status()
		);
		$this->assertSame( 403, $this->request( 'GET', '/wp/v2/knowledge/' . $id )->get_status() );
		$this->assertFalse( current_user_can( 'edit_post', $id ) );
	}

	public function test_collection_totals_exclude_other_users_private_rows() {
		$owner = $this->user( 'contributor' );
		$other = $this->user( 'contributor' );
		foreach ( array( $owner, $other ) as $author ) {
			wp_insert_post(
				array(
					'post_type'   => 'wp_knowledge',
					'post_status' => 'private',
					'post_author' => $author,
					'post_title'  => 'Private note',
				)
			);
		}
		wp_set_current_user( $owner );
		$response = $this->request( 'GET', '/wp/v2/knowledge', array( 'status' => 'private' ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 1, $response->get_data() );
		$this->assertSame( 1, $response->get_headers()['X-WP-Total'] );
	}

	public function test_guideline_save_sanitizes_content_and_preserves_record_identity() {
		wp_set_current_user( $this->user( 'administrator' ) );
		$response = $this->request(
			'POST',
			'/wp/v2/knowledge',
			array(
				'slug'    => 'guideline-copy',
				'title'   => 'Ignored title',
				'content' => '<b>Clear writing</b>',
				'status'  => 'publish',
			)
		);
		$this->assertSame( 201, $response->get_status() );
		$id = $response->get_data()['id'];
		$this->assertSame( 'Copy', get_post( $id )->post_title );
		$this->assertSame( 'Clear writing', get_post( $id )->post_content );
		$this->assertSame( array( 'guideline' ), wp_get_object_terms( $id, 'wp_knowledge_type', array( 'fields' => 'slugs' ) ) );
		$response = $this->request( 'POST', '/wp/v2/knowledge/' . $id, array( 'content' => 'Updated copy' ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $id, $response->get_data()['id'] );
		$this->assertSame( 'guideline-copy', get_post( $id )->post_name );
	}

	public function test_block_guidelines_keep_canonical_block_titles() {
		wp_set_current_user( $this->user( 'administrator' ) );
		$response = $this->request(
			'POST',
			'/wp/v2/knowledge',
			array(
				'slug'    => 'guideline-block-core_paragraph',
				'title'   => 'core/paragraph',
				'content' => 'Keep it short.',
				'status'  => 'publish',
			)
		);
		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'core/paragraph', get_post( $response->get_data()['id'] )->post_title );
	}

	public function test_custom_scopes_are_exposed_by_rest() {
		wp_set_current_user( $this->user( 'administrator' ) );
		add_filter(
			'wp_guideline_scopes',
			static function ( $scopes ) {
				$scopes['custom'] = array(
					'title'       => 'Custom',
					'description' => 'Custom scope.',
					'order'       => 99,
				);
				return $scopes;
			}
		);
		$response = $this->request( 'GET', '/wp/v2/knowledge/guideline-scopes' );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'site', 'copy', 'images', 'blocks', 'additional', 'custom' ), array_column( $response->get_data(), 'slug' ) );
	}

	public function test_personalos_bridge_contract_is_available() {
		$type = get_post_type_object( 'wp_knowledge' );
		$this->assertSame( 'knowledge', $type->rest_base );
		$this->assertTrue( is_object_in_taxonomy( 'wp_knowledge', 'wp_knowledge_type' ) );
		register_post_meta(
			'wp_knowledge',
			'_personalos_source',
			array(
				'type'         => 'string',
				'single'       => true,
				'show_in_rest' => true,
			)
		);
		$this->assertArrayHasKey( '_personalos_source', get_registered_meta_keys( 'post', 'wp_knowledge' ) );
	}
	public function test_owner_can_edit_trash_and_restore_private_knowledge() {
		wp_set_current_user( $this->user( 'contributor' ) );
		$created = $this->request(
			'POST',
			'/wp/v2/knowledge',
			array(
				'title'   => 'Private note',
				'content' => 'Original',
			)
		);
		$id      = $created->get_data()['id'];
		$updated = $this->request( 'POST', '/wp/v2/knowledge/' . $id, array( 'content' => 'Edited' ) );
		$this->assertSame( 200, $updated->get_status() );
		$this->assertSame( 'Edited', get_post( $id )->post_content );
		$this->assertSame( 200, $this->request( 'DELETE', '/wp/v2/knowledge/' . $id )->get_status() );
		$this->assertSame( 'trash', get_post( $id )->post_status );
		$this->assertTrue( current_user_can( 'delete_post', $id ) );
		$restored = $this->request( 'POST', '/wp/v2/knowledge/' . $id, array( 'status' => 'private' ) );
		$this->assertSame( 200, $restored->get_status() );
		$this->assertSame( 'private', get_post( $id )->post_status );
	}

	public function test_guideline_length_limit_counts_unicode_characters() {
		wp_set_current_user( $this->user( 'administrator' ) );
		add_filter(
			'wp_guideline_max_length',
			static function () {
				return 3;
			}
		);
		$created = $this->request(
			'POST',
			'/wp/v2/knowledge',
			array(
				'slug'    => 'guideline-copy',
				'content' => 'ąćęłń',
				'status'  => 'publish',
			)
		);
		$this->assertSame( 201, $created->get_status() );
		$this->assertSame( 'ąćę', get_post( $created->get_data()['id'] )->post_content );
	}

	public function test_non_guideline_knowledge_preserves_block_markup() {
		wp_set_current_user( $this->user( 'administrator' ) );
		$content = '<!-- wp:paragraph --><p>A note.</p><!-- /wp:paragraph -->';
		$created = $this->request(
			'POST',
			'/wp/v2/knowledge',
			array(
				'slug'    => 'my-note',
				'content' => $content,
			)
		);
		$this->assertSame( 201, $created->get_status() );
		$this->assertSame( $content, get_post( $created->get_data()['id'] )->post_content );
	}
}
