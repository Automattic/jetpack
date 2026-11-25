<?php
/**
 * Tests for the Proposals engine with the post-field handler.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Post_Fields_Handler;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposal_Lock;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposal_Store;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposals;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Create, update, discard, reject and apply.
 *
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposals
 */
#[CoversClass( Proposals::class )]
class Proposals_Test extends Proposals_TestCase {

	public function test_creating_a_proposal_leaves_the_live_post_unchanged(): void {
		$page_id = $this->create_post();
		$before  = get_post( $page_id )->to_array();

		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Plans & Pricing',
					'content' => '<!-- wp:paragraph --><p>New "copy"</p><!-- /wp:paragraph -->',
				),
			)
		);

		$this->assertSame( 'pending', $proposal['status'] );
		$this->assertTrue( wp_is_uuid( $proposal['uuid'], 4 ) );
		$this->assertSame( $before, get_post( $page_id )->to_array() );
		// Without unfiltered_html, kses encodes the ampersand as core does when saving a title.
		$this->assertSame( 'Plans &amp; Pricing', $proposal['items'][0]['change']['fields']['post_title']['to'] );
		$this->assertSame( 'Pricing', $proposal['items'][0]['change']['fields']['post_title']['from'] );
	}

	public function test_content_changed_by_filtering_returns_a_warning_naming_its_item_and_target(): void {
		$page_id = $this->create_post();
		$warn    = static fn() => array( 'stripped' => 'iframe' );
		add_filter( 'jetpack_proposals_content_warnings', $warn );

		try {
			$result = Proposals::create(
				'Embed',
				array(
					array(
						'post_id' => $page_id,
						'content' => '<p>Before</p><iframe src="https://example.com/"></iframe>',
					),
				)
			);
		} finally {
			remove_filter( 'jetpack_proposals_content_warnings', $warn );
		}

		$this->assertIsArray( $result );
		$this->assertSame(
			array(
				array(
					'item'    => 'i1',
					'target'  => array(
						'post_id'   => $page_id,
						'post_type' => 'page',
					),
					'content' => array( 'stripped' => 'iframe' ),
				),
			),
			$result['warnings']
		);
	}

	public function test_payload_json_survives_content_filters(): void {
		$page_id = $this->create_post();
		$content = '<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">Quote: "hi" \\ slash</p><!-- /wp:paragraph -->';

		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'content' => $content,
				),
			)
		);

		$stored = $this->stored_payload( $proposal['id'] );
		$this->assertSame( Proposal_Store::PAYLOAD_VERSION, $stored['version'] );
		$this->assertSame( $content, $stored['items'][0]['change']['fields']['post_content']['to'] );
	}

	/**
	 * Requests create() refuses.
	 *
	 * @dataProvider invalid_requests
	 *
	 * @param string   $code     Expected error code.
	 * @param callable $requests Builds the requests from a published and a draft page ID.
	 */
	#[DataProvider( 'invalid_requests' )]
	public function test_invalid_requests_are_refused( string $code, callable $requests ): void {
		$page_id  = $this->create_post();
		$draft_id = $this->create_post( array( 'post_status' => 'draft' ) );

		$result = Proposals::create( 'Refused', $requests( $page_id, $draft_id ) );

		$this->assert_wp_error_code( $code, $result );
		$this->assertStringStartsWith( 'Nothing was saved: ', $result->get_error_message(), 'MCP clients see only the message.' );
	}

	/**
	 * Requests and the error each gives.
	 *
	 * @return array<string, array{string, callable}>
	 */
	public static function invalid_requests(): array {
		return array(
			'matches the live post'          => array(
				'proposal_no_changes',
				static fn( int $page_id ) => array(
					array(
						'post_id' => $page_id,
						'title'   => 'Pricing',
					),
				),
			),
			'unpublished post'               => array(
				'proposal_invalid_post',
				static fn( int $page_id, int $draft_id ) => array(
					array(
						'post_id' => $draft_id,
						'title'   => 'New',
					),
				),
			),
			'meta outside the list'          => array(
				'proposal_invalid_meta',
				static fn( int $page_id ) => array(
					array(
						'post_id' => $page_id,
						'meta'    => array( '_edit_lock' => '1' ),
					),
				),
			),
			'the same post twice'            => array(
				'proposal_duplicate_item',
				static fn( int $page_id ) => array(
					array(
						'post_id' => $page_id,
						'title'   => 'One',
					),
					array(
						'post_id' => $page_id,
						'excerpt' => 'Two',
					),
				),
			),
			'an image URL as featured_media' => array(
				'proposal_invalid_media',
				static fn( int $page_id ) => array(
					array(
						'post_id'        => $page_id,
						'featured_media' => 'https://example.com/x.jpg',
					),
				),
			),
			'nested term IDs'                => array(
				'proposal_invalid_terms',
				static fn() => array(
					array(
						'post_id'    => wp_insert_post( array( 'post_status' => 'publish', 'post_title' => 'Post' ) ), // phpcs:ignore WordPress.Arrays.ArrayDeclarationSpacing.AssociativeArrayFound
						'categories' => array( array( 9 ) ),
					),
				),
			),
			'a title that is not text'       => array(
				'proposal_invalid_item',
				static fn( int $page_id ) => array(
					array(
						'post_id' => $page_id,
						'title'   => array( 'Pricing' ),
					),
				),
			),
		);
	}

	public function test_markup_is_filtered_even_for_users_with_unfiltered_html(): void {
		remove_filter( 'map_meta_cap', array( $this, 'deny_unfiltered_html' ), 10 );
		$this->assertTrue( current_user_can( 'unfiltered_html' ) );
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'content' => '<p>Kept</p><script>alert(1)</script>',
				),
			)
		);

		$content = $proposal['items'][0]['change']['fields']['post_content']['to'];
		$this->assertStringStartsWith( '<p>Kept</p>', $content );
		$this->assertStringNotContainsString( '<script', $content, 'The preview filters, so apply must not write what it hid.' );
	}

	public function test_apply_updates_fields_meta_and_terms(): void {
		$post_id     = $this->create_post( array( 'post_type' => 'post' ) );
		$category_id = (int) wp_insert_term( 'Proposals test', 'category' )['term_id'];

		$proposal = $this->create_proposal(
			array(
				array(
					'post_id'    => $post_id,
					'title'      => 'New title',
					'excerpt'    => 'New excerpt',
					'slug'       => 'new-slug',
					'categories' => array( $category_id ),
					'meta'       => array(
						'advanced_seo_description' => 'Search description',
						'jetpack_seo_noindex'      => true,
					),
				),
			)
		);

		$result = Proposals::apply( $proposal['id'], $proposal['hash'] );

		$this->assert_not_wp_error( $result );
		$this->assertArrayNotHasKey( 'error', $result['results'][0] );
		$post = get_post( $post_id );
		$this->assertSame( 'New title', $post->post_title );
		$this->assertSame( 'New excerpt', $post->post_excerpt );
		$this->assertSame( 'new-slug', $post->post_name );
		$this->assertSame( array( $category_id ), Post_Fields_Handler::get_term_ids( $post_id, 'category' ) );
		$this->assertSame( 'Search description', get_post_meta( $post_id, 'advanced_seo_description', true ) );
		$this->assertTrue( Post_Fields_Handler::get_meta_value( $post_id, 'jetpack_seo_noindex' ) );
		$this->assertSame( 'applied', $this->stored( $proposal['id'] )['status'] );

		wp_delete_term( $category_id, 'category' );
	}

	public function test_applying_text_fields_creates_a_revision_credited_to_the_person_applying(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed title',
					'meta'    => array( 'jetpack_seo_html_title' => 'SEO' ),
				),
			)
		);
		$before   = count( wp_get_post_revisions( $page_id ) );
		$applier  = $this->user( 'editor' );
		$proposer = get_current_user_id();
		$this->assertNotSame( $proposer, $applier );
		wp_set_current_user( $applier );

		$this->assert_not_wp_error( Proposals::apply( $proposal['id'], $proposal['hash'] ) );

		$revisions = wp_get_post_revisions( $page_id );
		$this->assertCount( $before + 1, $revisions, 'One revision, for the title. Meta makes none.' );
		$latest = reset( $revisions );
		$this->assertSame( 'Proposed title', $latest->post_title );
		$this->assertSame( $applier, (int) $latest->post_author );
	}

	public function test_apply_requires_the_hash_of_the_approved_version(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'New',
				),
			)
		);

		$this->assert_wp_error_code( 'proposal_changed', Proposals::apply( $proposal['id'], str_repeat( '0', 64 ) ) );

		$revised = Proposals::update(
			$proposal['id'],
			null,
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Revised after approval',
				),
			)
		);
		$this->assert_not_wp_error( $revised );
		$this->assert_wp_error_code( 'proposal_changed', Proposals::apply( $proposal['id'], $proposal['hash'] ), 'The hash the person approved no longer matches.' );
		$this->assertSame( 'Pricing', get_post( $page_id )->post_title );
	}

	public function test_apply_and_reject_record_who_acted_and_through_which_client(): void {
		$page_id  = $this->create_post();
		$applied  = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Applied',
				),
			)
		);
		$rejected = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Rejected',
				),
			)
		);
		$context  = array(
			'client' => 'Claude <b>Desktop</b>',
			'agent'  => 'site-agent',
		);

		$this->assert_not_wp_error( Proposals::apply( $applied['id'], $applied['hash'], $context ) );
		$this->assertTrue( Proposals::reject( $rejected['id'], $rejected['hash'], 'Not yet', $context ) );

		foreach ( array( $applied, $rejected ) as $proposal ) {
			$response = Proposals::to_response( $this->stored( $proposal['id'] ) );
			$this->assertSame( get_current_user_id(), $response['reviewed_by'] );
			$this->assertSame( 'Claude Desktop', $response['client'] );
			$this->assertSame( 'site-agent', $this->stored( $proposal['id'] )['review']['agent'] );
		}
		$this->assertSame( 'Not yet', Proposals::to_response( $this->stored( $rejected['id'] ) )['review_note'] );
	}

	public function test_live_edits_make_the_proposal_stale_and_nothing_is_applied(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
			)
		);

		// Same second as the proposal, so only the content hash can catch it.
		wp_update_post(
			array(
				'ID'           => $page_id,
				'post_content' => 'Edited live',
			)
		);
		$result = Proposals::apply( $proposal['id'], $proposal['hash'] );

		$this->assert_wp_error_code( 'proposal_stale', $result );
		$this->assertSame( 'Pricing', get_post( $page_id )->post_title );
		$this->assertSame( 'stale', $this->stored( $proposal['id'] )['status'] );
	}

	public function test_applying_marks_other_proposals_for_the_same_posts_stale(): void {
		$page_id  = $this->create_post();
		$first    = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'First',
				),
			)
		);
		$second   = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Second',
				),
			)
		);
		$separate = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post( array( 'post_title' => 'Other' ) ),
					'title'   => 'Separate',
				),
			)
		);

		$this->assert_not_wp_error( Proposals::apply( $second['id'], $second['hash'] ) );

		$this->assertSame( 'stale', $this->stored( $first['id'] )['status'] );
		$this->assertSame( 'pending', $this->stored( $separate['id'] )['status'] );
		$this->assertSame( 'Second', get_post( $page_id )->post_title );
	}

	public function test_applying_leaves_proposals_for_other_fields_of_the_same_post_pending(): void {
		$page_id = $this->create_post();
		$title   = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed title',
				),
			)
		);
		$meta    = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'meta'    => array( 'advanced_seo_description' => 'Proposed description' ),
				),
			)
		);

		$this->assert_not_wp_error( Proposals::apply( $meta['id'], $meta['hash'] ) );

		$this->assertSame( 'pending', $this->stored( $title['id'] )['status'] );
		$this->assert_not_wp_error( Proposals::apply( $title['id'], $title['hash'] ) );
	}

	public function test_applying_does_not_mark_a_proposal_that_is_being_applied_stale(): void {
		$page_id = $this->create_post();
		$first   = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'First',
				),
			)
		);
		$second  = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Second',
				),
			)
		);
		$lock    = Proposal_Lock::option_name( $first['id'] );
		add_option( $lock, time(), '', false );

		try {
			$this->assert_not_wp_error( Proposals::apply( $second['id'], $second['hash'] ) );
			$this->assertSame( 'pending', $this->stored( $first['id'] )['status'] );
		} finally {
			delete_option( $lock );
		}
	}

	/**
	 * Tamper with the stored payload, as XML-RPC or a super admin could.
	 *
	 * @dataProvider tampered_payloads
	 *
	 * @param callable $tamper Changes the stored items.
	 */
	#[DataProvider( 'tampered_payloads' )]
	public function test_payloads_the_engine_could_not_produce_are_never_applied( callable $tamper ): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
			)
		);

		$payload          = $this->stored_payload( $proposal['id'] );
		$payload['items'] = $tamper( $payload['items'], $page_id );
		$this->write_payload_directly( $proposal['id'], (string) wp_json_encode( $payload, JSON_UNESCAPED_SLASHES ) );
		$tampered = $this->stored( $proposal['id'] );

		$this->assertSame( array(), $tampered['items'] );
		$this->assertFalse( Proposals::current_user_can_review( $tampered ) );
		$this->assert_wp_error_code( 'proposal_invalid', Proposals::apply( $proposal['id'], $tampered['hash'] ) );
		$this->assertSame( 'Pricing', get_post( $page_id )->post_title );
	}

	/**
	 * Payloads the engine could not have produced.
	 *
	 * @return array<string, array{callable}>
	 */
	public static function tampered_payloads(): array {
		return array(
			'unlisted post field'  => array(
				static function ( array $items ): array {
					$items[0]['change']['fields']['post_author'] = array( 'to' => '0' );
					return $items;
				},
			),
			'unsanitized SEO text' => array(
				static function ( array $items ): array {
					$items[0]['change']['meta']['advanced_seo_description'] = array(
						'from' => '',
						'to'   => '<b>Bold</b>',
					);
					return $items;
				},
			),
			'unlisted meta key'    => array(
				static function ( array $items ): array {
					$items[0]['change']['meta']['_edit_lock'] = array(
						'from' => '',
						'to'   => '1',
					);
					return $items;
				},
			),
			'unlisted taxonomy'    => array(
				static function ( array $items ): array {
					$items[0]['change']['terms']['post_format'] = array(
						'from' => array(),
						'to'   => array( 1 ),
					);
					return $items;
				},
			),
			'unlisted post type'   => array(
				static function ( array $items ): array {
					$items[0]['target']['post_type'] = 'wp_template';
					return $items;
				},
			),
			'unknown item key'     => array(
				static function ( array $items ): array {
					$items[0]['post_status'] = 'draft';
					return $items;
				},
			),
			'unknown item type'    => array(
				static function ( array $items ): array {
					$items[0]['type'] = 'settings';
					return $items;
				},
			),
			'duplicate post'       => array(
				static function ( array $items ): array {
					$items[]          = $items[0];
					$items[1]['id']   = 'i2';
					return $items;
				},
			),
			'duplicate item id'    => array(
				static function ( array $items, int $page_id ): array {
					$items[]                       = $items[0];
					$items[1]['target']['post_id'] = $page_id + 1;
					return $items;
				},
			),
			'non-integer post ID'  => array(
				static function ( array $items, int $page_id ): array {
					$items[0]['target']['post_id'] = (string) $page_id;
					return $items;
				},
			),
			'ref on a post change' => array(
				static function ( array $items ): array {
					$items[0]['ref'] = 'about';
					return $items;
				},
			),
			'too many items'       => array(
				static function ( array $items ): array {
					foreach ( range( 1, Proposal_Store::MAX_ITEMS ) as $n ) {
						$extra                      = $items[0];
						$extra['id']                = 'i' . ( $n + 1 );
						$extra['target']['post_id'] = $items[0]['target']['post_id'] + $n;
						$items[]                    = $extra;
					}
					return $items;
				},
			),
		);
	}

	public function test_a_post_whose_type_changed_is_a_conflict(): void {
		global $wpdb;
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
			)
		);
		$wpdb->update( $wpdb->posts, array( 'post_type' => 'post' ), array( 'ID' => $page_id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Changes the type without touching the modified time.
		clean_post_cache( $page_id );

		$this->assertNotEmpty( Proposals::find_conflicts( $proposal ) );
	}

	public function test_no_change_lands_while_a_proposal_is_locked(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
			)
		);
		$lock     = Proposal_Lock::option_name( $proposal['id'] );
		add_option( $lock, array( 'started_at' => time() - 10 * MINUTE_IN_SECONDS ), '', false );

		try {
			$results = array(
				'update'  => Proposals::update(
					$proposal['id'],
					'Renamed',
					array(
						array(
							'post_id' => $page_id,
							'title'   => 'Revised',
						),
					)
				),
				'discard' => Proposals::discard( $proposal['id'] ),
				'reject'  => Proposals::reject( $proposal['id'], $proposal['hash'], 'No' ),
				'apply'   => Proposals::apply( $proposal['id'], $proposal['hash'] ),
			);
			foreach ( $results as $operation => $result ) {
				$this->assert_wp_error_code( 'proposal_locked', $result, $operation );
			}
			$this->assertStringContainsString( 'started 10 minutes ago', $results['apply']->get_error_message() );
			$this->assertSame( $proposal, Proposals::get( $proposal['id'] ) );
			$this->assertSame( 'Pricing', get_post( $page_id )->post_title );
			$this->assertTrue( Proposal_Lock::is_held( $proposal['id'] ), 'A lock is never taken over, however old.' );
			$this->assertStringContainsString( 'delete the ' . $lock . ' option', $results['apply']->get_error_message(), 'An agent told only to wait would retry forever.' );
		} finally {
			delete_option( $lock );
		}
	}

	public function test_an_apply_that_cannot_be_marked_applied_says_the_changes_are_live(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
			)
		);
		$refuse   = static fn( $empty, $postarr ) => Proposal_Store::STATUSES['applied'] === ( $postarr['post_status'] ?? '' ) ? true : $empty;
		add_filter( 'wp_insert_post_empty_content', $refuse, 10, 2 );
		try {
			$result = Proposals::apply( $proposal['id'], $proposal['hash'] );
			$this->assert_wp_error_code( 'proposal_not_saved', $result );
			$this->assertStringContainsString( 'changes were written to the live site', $result->get_error_message() );
			$this->assertSame( 'Proposed', get_post( $page_id )->post_title );
			$this->assertNotNull( Proposals::stopped_apply( $this->stored( $proposal['id'] ) ) );
		} finally {
			remove_filter( 'wp_insert_post_empty_content', $refuse, 10 );
		}
	}

	public function test_a_stale_proposal_is_not_reopened_by_a_new_title_alone(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
			)
		);
		wp_update_post(
			array(
				'ID'         => $page_id,
				'post_title' => 'Edited live',
			)
		);
		$this->assert_wp_error_code( 'proposal_stale', Proposals::apply( $proposal['id'], $proposal['hash'] ) );

		$this->assert_wp_error_code( 'proposal_stale', Proposals::update( $proposal['id'], 'Renamed', null ) );
		$this->assertSame( 'stale', $this->stored( $proposal['id'] )['status'] );
	}

	public function test_a_second_apply_for_the_same_post_waits_for_the_first(): void {
		$page_id = $this->create_post();
		$first   = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'First',
				),
			)
		);
		$second  = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'content' => '<p>Second</p>',
				),
			)
		);
		$nested  = null;
		$race    = static function ( $post_id ) use ( $page_id, $second, &$nested ) {
			if ( $page_id === (int) $post_id && null === $nested ) {
				$nested = Proposals::apply( $second['id'], $second['hash'] );
			}
		};
		add_action( 'pre_post_update', $race );

		try {
			$this->assert_not_wp_error( Proposals::apply( $first['id'], $first['hash'] ) );
		} finally {
			remove_action( 'pre_post_update', $race );
		}

		$this->assert_wp_error_code( 'proposal_locked', $nested, 'Applied while the first was writing the same post.' );
		$this->assertFalse( get_option( Proposal_Lock::target_option_name( 'post:' . $page_id ) ) );

		$this->assert_not_wp_error( Proposals::apply( $second['id'], $second['hash'] ), 'Other fields, so it still applies.' );
		$this->assertSame( 'First', get_post( $page_id )->post_title, 'Saving the content keeps the title written first.' );
		$this->assertSame( '<p>Second</p>', get_post( $page_id )->post_content );
	}

	public function test_a_busy_target_releases_the_targets_already_locked(): void {
		$free_id  = $this->create_post();
		$busy_id  = $this->create_post( array( 'post_title' => 'Other' ) );
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $free_id,
					'title'   => 'Proposed',
				),
				array(
					'post_id' => $busy_id,
					'title'   => 'Proposed',
				),
			)
		);
		$busy     = Proposal_Lock::target_option_name( 'post:' . $busy_id );
		add_option( $busy, array( 'started_at' => time() ), '', false );

		try {
			$this->assert_wp_error_code( 'proposal_locked', Proposals::apply( $proposal['id'], $proposal['hash'] ) );
		} finally {
			delete_option( $busy );
		}

		$this->assertFalse( get_option( Proposal_Lock::target_option_name( 'post:' . $free_id ) ) );
		$this->assertSame( 'Pricing', get_post( $free_id )->post_title );
	}

	public function test_a_lock_already_stored_is_not_taken_again_when_the_option_cache_misses_it(): void {
		global $wpdb;
		$lock = Proposal_Lock::option_name( 123 );
		$wpdb->insert( $wpdb->options, array( 'option_name' => $lock, 'option_value' => 'held', 'autoload' => 'off' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.Arrays.ArrayDeclarationSpacing.AssociativeArrayFound
		wp_cache_set( 'notoptions', array( $lock => true ), 'options' );

		try {
			$this->assertFalse( Proposal_Lock::acquire( 123 ), 'As in a race, where both requests found no lock: add_option() would take it again.' );
			$this->assertSame( 'held', $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $lock ) ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		} finally {
			$wpdb->delete( $wpdb->options, array( 'option_name' => $lock ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			wp_cache_delete( 'notoptions', 'options' );
		}
	}

	public function test_a_proposal_trashed_outside_the_feature_reads_as_discarded_and_cannot_be_applied(): void {
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Proposed',
				),
			)
		);
		wp_trash_post( $proposal['id'] );

		$this->assertSame( 'discarded', $this->stored( $proposal['id'] )['status'] );
		$this->assert_wp_error_code( 'proposal_closed', Proposals::apply( $proposal['id'], $proposal['hash'] ) );
	}

	public function test_only_the_author_or_an_editor_of_others_posts_can_revise_or_discard(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
			)
		);
		wp_set_current_user( $this->user( 'author' ) );

		$this->assert_wp_error_code( 'proposal_not_found', Proposals::update( $proposal['id'], 'Taken over', null ) );
		$this->assert_wp_error_code( 'proposal_not_found', Proposals::discard( $proposal['id'] ) );
		$this->assertSame( 'pending', $this->stored( $proposal['id'] )['status'] );
	}

	public function test_apply_reports_each_post_outcome(): void {
		$page_id   = $this->create_post();
		$failed_id = $this->create_post( array( 'post_title' => 'Other' ) );
		$proposal  = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
				array(
					'post_id' => $failed_id,
					'title'   => 'Refused',
				),
			)
		);
		$refuse    = static function ( $maybe_empty, $postarr ) use ( $failed_id ) {
			return (int) ( $postarr['ID'] ?? 0 ) === $failed_id ? true : $maybe_empty;
		};
		add_filter( 'wp_insert_post_empty_content', $refuse, 10, 2 );
		try {
			$this->assert_not_wp_error( Proposals::apply( $proposal['id'], $proposal['hash'] ) );
		} finally {
			remove_filter( 'wp_insert_post_empty_content', $refuse, 10 );
		}

		$applied = Proposals::to_response( $this->stored( $proposal['id'] ) )['applied'];
		$this->assertSame( 'applied', $this->stored( $proposal['id'] )['status'] );
		$this->assertSame( array( 'post_title' ), $applied[0]['changed'] );
		$this->assertArrayNotHasKey( 'error', $applied[0] );
		$this->assertNotEmpty( $applied[1]['error'] );
		$this->assertSame( 'Other', get_post( $failed_id )->post_title );
	}

	public function test_a_meta_write_that_does_not_stick_is_reported_as_failed(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'meta'    => array( 'jetpack_seo_html_title' => 'Proposed' ),
				),
			)
		);
		$refuse   = static function ( $check, $object_id, $meta_key ) use ( $page_id ) {
			return $page_id === (int) $object_id && 'jetpack_seo_html_title' === $meta_key ? false : $check;
		};
		add_filter( 'update_post_metadata', $refuse, 10, 3 );
		add_filter( 'add_post_metadata', $refuse, 10, 3 );
		try {
			$result = Proposals::apply( $proposal['id'], $proposal['hash'] );
			$this->assertSame( 'Could not save jetpack_seo_html_title.', $result['results'][0]['error'] );
		} finally {
			remove_filter( 'update_post_metadata', $refuse, 10 );
			remove_filter( 'add_post_metadata', $refuse, 10 );
		}
	}

	public function test_an_apply_that_stops_partway_is_reported_until_applied_again(): void {
		$page_id   = $this->create_post();
		$second_id = $this->create_post( array( 'post_title' => 'Other' ) );
		$proposal  = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
				array(
					'post_id' => $second_id,
					'title'   => 'Never reached',
				),
			)
		);
		// As if the worker died while writing the second post.
		$die = static function ( $post_id ) use ( $second_id ) {
			if ( (int) $post_id === $second_id ) {
				throw new RuntimeException( 'died' );
			}
		};
		add_action( 'pre_post_update', $die );
		try {
			Proposals::apply( $proposal['id'], $proposal['hash'] );
			$this->fail( 'The apply should have stopped.' );
		} catch ( RuntimeException $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Expected.
		} finally {
			remove_action( 'pre_post_update', $die );
		}

		$stopped = $this->stored( $proposal['id'] );
		$this->assertSame( 'Proposed', get_post( $page_id )->post_title, 'The first post was written.' );
		$this->assertSame( 'pending', $stopped['status'] );
		$this->assertSame( get_current_user_id(), Proposals::stopped_apply( $stopped )['user_id'] );
		$this->assertStringContainsString( 'stopped partway', Proposals::to_response( $stopped )['apply_stopped'] );

		$lock = Proposal_Lock::option_name( $proposal['id'] );
		add_option( $lock, array( 'started_at' => time() ), '', false );
		try {
			$this->assertNull( Proposals::stopped_apply( $stopped ), 'A held lock may be an apply still running.' );
		} finally {
			delete_option( $lock );
		}

		$retry = Proposals::apply( $proposal['id'], $proposal['hash'] );
		$this->assert_wp_error_code( 'proposal_stale', $retry, 'The written post makes a retry stale.' );
		$revised = Proposals::update(
			$proposal['id'],
			null,
			array(
				array(
					'post_id' => $second_id,
					'title'   => 'Revised',
				),
			)
		);
		$this->assert_not_wp_error( $revised );
		$this->assertNull( Proposals::stopped_apply( $revised['proposal'] ), 'A revision is built on the live content, partial writes included.' );
	}

	public function test_locks_record_their_holder_and_are_released_at_shutdown(): void {
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Proposed',
				),
			)
		);

		try {
			// As if the apply died before its finally block.
			$this->assertTrue( Proposal_Lock::acquire( $proposal['id'] ) );
			$this->assertFalse( Proposal_Lock::acquire( $proposal['id'] ) );

			Proposal_Lock::release_held();

			$this->assertFalse( Proposal_Lock::is_held( $proposal['id'] ) );
			$this->assert_not_wp_error( Proposals::apply( $proposal['id'], $proposal['hash'] ) );
		} finally {
			Proposal_Lock::release_held();
		}
	}

	public function test_meta_changes_made_live_are_conflicts(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'meta'    => array( 'jetpack_seo_html_title' => 'Proposed' ),
				),
			)
		);

		update_post_meta( $page_id, 'jetpack_seo_html_title', 'Edited live' );

		$this->assertNotEmpty( Proposals::find_conflicts( $this->stored( $proposal['id'] ) ) );
	}

	public function test_rejection_records_feedback_and_revision_reopens_the_proposal(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Too long a title',
				),
			)
		);

		$this->assertTrue( Proposals::reject( $proposal['id'], $proposal['hash'], 'Shorter please' ) );
		$rejected = $this->stored( $proposal['id'] );
		$this->assertSame( 'rejected', $rejected['status'] );
		$this->assertSame( 'Shorter please', Proposals::to_response( $rejected )['review_note'] );

		// Either would reopen the proposal with its hash unchanged, so the rejected hash could apply it.
		$this->assert_wp_error_code( 'proposal_no_changes', Proposals::update( $proposal['id'], 'Renamed', null ) );
		$this->assert_wp_error_code(
			'proposal_no_changes',
			Proposals::update(
				$proposal['id'],
				null,
				array(
					array(
						'post_id' => $page_id,
						'title'   => 'Too long a title',
					),
				)
			)
		);
		$this->assertSame( 'rejected', $this->stored( $proposal['id'] )['status'] );

		$revised = Proposals::update(
			$proposal['id'],
			null,
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Short',
				),
			)
		);

		$this->assert_not_wp_error( $revised );
		$this->assertSame( 'pending', $revised['proposal']['status'] );
		$this->assertSame( array(), $revised['proposal']['review'] );
		$this->assertNotSame( $proposal['hash'], $revised['proposal']['hash'] );
	}

	public function test_applied_proposals_cannot_be_applied_again_discarded_or_revised(): void {
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'New',
				),
			)
		);
		Proposals::apply( $proposal['id'], $proposal['hash'] );

		$this->assert_wp_error_code( 'proposal_closed', Proposals::discard( $proposal['id'] ) );
		$this->assert_wp_error_code( 'proposal_closed', Proposals::update( $proposal['id'], 'x', null ) );
		$again = Proposals::apply( $proposal['id'], $proposal['hash'] );
		$this->assert_wp_error_code( 'proposal_closed', $again );
		$this->assertStringContainsString( 'already applied', $again->get_error_message(), 'MCP clients see only the message, not the code.' );
	}

	public function test_query_lists_visible_proposals_by_status_and_target_newest_first(): void {
		$page_id  = $this->create_post();
		$other_id = $this->create_post( array( 'post_title' => 'Other' ) );
		$older    = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Older',
				),
			)
		);
		$rejected = $this->create_proposal(
			array(
				array(
					'post_id' => $other_id,
					'title'   => 'Rejected',
				),
			)
		);
		Proposals::reject( $rejected['id'], $rejected['hash'], 'No' );
		$applied = $this->create_proposal(
			array(
				array(
					'post_id' => $other_id,
					'excerpt' => 'Applied',
				),
			)
		);
		Proposals::apply( $applied['id'], $applied['hash'] );
		$open = array( 'pending', 'stale', 'rejected' );

		$this->assertSame( array( $rejected['id'], $older['id'] ), array_column( Proposals::query( $open ), 'proposal_id' ) );
		$this->assertSame( array( $applied['id'] ), array_column( Proposals::query( array( 'applied' ) ), 'proposal_id' ) );
		$this->assertSame( array( $older['id'] ), array_column( Proposals::query( $open, 'post:' . $page_id ), 'proposal_id' ) );
		$this->assertSame( array(), Proposals::query( array( 'unknown' ) ) );
		$this->assertSame(
			array(
				'proposal_id' => $older['id'],
				'title'       => 'Refresh pricing',
				'status'      => 'pending',
				'created_gmt' => $older['created_gmt'],
				'author'      => get_current_user_id(),
				'items'       => array(
					array(
						'id'     => 'i1',
						'type'   => Post_Fields_Handler::TYPE,
						'target' => array(
							'post_id'   => $page_id,
							'post_type' => 'page',
						),
					),
				),
			),
			Proposals::query( $open, 'post:' . $page_id )[0]
		);

		wp_set_current_user( $this->user( 'author' ) );
		$this->assertSame( array(), Proposals::query( $open ), 'An author can neither manage nor review these.' );
	}

	public function test_nothing_works_while_the_flag_is_off(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
			)
		);
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Proposals::FLAG );

		$this->assertNull( Proposals::get( $proposal['id'] ) );
		$this->assertNull( Proposals::get_by_uuid( $proposal['uuid'] ) );
		$this->assert_wp_error_code( 'proposal_unavailable', Proposals::query( array( 'pending' ) ) );
		$this->assertFalse( Proposals::current_user_can_review( $proposal ) );
		$this->assert_wp_error_code(
			'proposal_unavailable',
			Proposals::create(
				'Off',
				array(
					array(
						'post_id' => $page_id,
						'title'   => 'Off',
					),
				)
			)
		);
		$this->assert_wp_error_code( 'proposal_unavailable', Proposals::apply( $proposal['id'], $proposal['hash'] ) );
		$this->assertSame( 'Pricing', get_post( $page_id )->post_title );
	}

	public function test_the_access_filter_narrows_who_can_use_proposals(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
			)
		);
		add_filter( 'jetpack_proposals_user_has_access', '__return_false' );

		$this->assertFalse( Proposals::current_user_can_manage( $proposal ) );
		$this->assertFalse( Proposals::current_user_can_review( $proposal ) );
		$this->assert_wp_error_code( 'proposal_forbidden', Proposals::apply( $proposal['id'], $proposal['hash'] ) );
	}

	public function test_reviewing_needs_edit_access_to_every_post(): void {
		$author_id = $this->user( 'author' );
		$post_id   = $this->create_post(
			array(
				'post_type'   => 'post',
				'post_author' => $author_id,
			)
		);
		$admin_id  = get_current_user_id();
		wp_set_current_user( $author_id );
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $post_id,
					'title'   => 'Proposed',
				),
			)
		);
		wp_set_current_user( $admin_id );
		wp_update_post(
			array(
				'ID'          => $post_id,
				'post_author' => $this->user( 'author' ),
			)
		);
		wp_set_current_user( $author_id );

		$this->assertFalse( Proposals::current_user_can_review( $proposal ) );
		$this->assert_wp_error_code( 'proposal_forbidden', Proposals::apply( $proposal['id'], $proposal['hash'] ), 'Its author can still be told why.' );
	}

	public function test_a_user_who_can_neither_manage_nor_review_a_proposal_cannot_tell_it_exists(): void {
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Proposed',
				),
			)
		);
		$applied  = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post( array( 'post_title' => 'Other' ) ),
					'title'   => 'Applied',
				),
			)
		);
		$this->assert_not_wp_error( Proposals::apply( $applied['id'], $applied['hash'] ) );
		wp_set_current_user( $this->user( 'author' ) );

		$this->assert_wp_error_code( 'proposal_not_found', Proposals::apply( $proposal['id'], $proposal['hash'] ) );
		$this->assert_wp_error_code( 'proposal_not_found', Proposals::reject( $applied['id'], str_repeat( '0', 64 ) ), 'Not proposal_closed, which would reveal its status.' );
	}

	public function test_locks_are_released_when_the_fatal_error_handler_runs(): void {
		$this->assertTrue( Proposal_Lock::acquire( 123 ) );

		try {
			$this->assertSame( 'Error', apply_filters( 'wp_php_error_message', 'Error', array() ) );
			$this->assertFalse( Proposal_Lock::is_held( 123 ) );
		} finally {
			Proposal_Lock::release_held();
		}
	}

	public function test_a_held_lock_is_seen_even_when_the_option_cache_says_it_is_missing(): void {
		global $wpdb;
		$lock = Proposal_Lock::option_name( 123 );
		$wpdb->insert( $wpdb->options, array( 'option_name' => $lock, 'option_value' => maybe_serialize( array( 'started_at' => time() ) ), 'autoload' => 'off' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.Arrays.ArrayDeclarationSpacing.AssociativeArrayFound
		wp_cache_set( 'notoptions', array( $lock => true ), 'options' );

		try {
			$this->assertTrue( Proposal_Lock::is_held( 123 ) );
			$this->assert_wp_error_code( 'proposal_locked', Proposal_Lock::with_lock( 123, '__return_true' ), 'Not proposal_not_saved.' );
		} finally {
			$wpdb->delete( $wpdb->options, array( 'option_name' => $lock ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			wp_cache_delete( 'notoptions', 'options' );
		}
	}

	public function test_no_role_can_edit_a_proposal_post_directly(): void {
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Proposed',
				),
			)
		);

		$this->assertFalse( current_user_can( 'edit_post', $proposal['id'] ), 'An administrator, as REST and XML-RPC writes check.' );
		$this->assertFalse( current_user_can( 'delete_post', $proposal['id'] ) );
	}

	public function test_the_response_carries_the_hash_and_a_description_of_each_change(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed title',
					'content' => "<!-- wp:paragraph --><p>New copy</p><!-- /wp:paragraph -->\n<!-- wp:paragraph --><p>Added</p><!-- /wp:paragraph -->",
					'meta'    => array(
						'jetpack_seo_noindex' => true,
						'_wp_page_template'   => 'default',
					),
				),
			)
		);

		$response = Proposals::to_response( $proposal );

		$this->assertSame( $proposal['hash'], $response['hash'] );
		$this->assertStringContainsString( Proposals::QUERY_VAR . '=' . $proposal['uuid'], $response['items'][0]['preview_url'] );
		$description = array_column( $response['items'][0]['description'], null, 'label' );
		$this->assertSame(
			array(
				'label' => 'Title',
				'kind'  => 'text',
				'from'  => 'Pricing',
				'to'    => 'Proposed title',
			),
			$description['Title']
		);
		$this->assertSame( 'diff', $description['Content']['kind'] );
		$this->assertStringContainsString( '- <!-- wp:paragraph --><p>Old copy</p>', $description['Content']['diff'] );
		$this->assertStringContainsString( '+ <!-- wp:paragraph --><p>Added</p>', $description['Content']['diff'] );
		$this->assertStringEndsNotWith( "\n", $description['Content']['diff'], 'A reader splitting on newlines would show an empty added line.' );
		$this->assertTrue( $description['Hide from search engines']['to'] );
		$this->assertArrayNotHasKey( 'Template', $description, 'Default matches the live value, so nothing is proposed.' );
		$this->assertSame( $page_id, $response['items'][0]['target']['post_id'] );
	}

	public function test_applied_items_keep_the_description_from_before_the_write(): void {
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'content' => '<!-- wp:paragraph --><p>New copy</p><!-- /wp:paragraph -->',
				),
			)
		);
		$this->assert_not_wp_error( Proposals::apply( $proposal['id'], $proposal['hash'] ) );

		$description = Proposals::to_response( $this->stored( $proposal['id'] ) )['items'][0]['description'][0];

		$this->assertSame( 'diff', $description['kind'] );
		$this->assertStringContainsString( '- <!-- wp:paragraph --><p>Old copy</p>', $description['diff'] );
		$this->assertStringContainsString( '+ <!-- wp:paragraph --><p>New copy</p>', $description['diff'] );
	}

	public function test_long_content_diffs_are_cut(): void {
		$lines    = array_map( static fn( $n ) => "<!-- wp:paragraph --><p>Line $n of the new copy</p><!-- /wp:paragraph -->", range( 1, 400 ) );
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'content' => implode( "\n", $lines ),
				),
			)
		);

		$diff = Proposals::to_response( $proposal )['items'][0]['description'][0]['diff'];

		$this->assertLessThanOrEqual( Post_Fields_Handler::MAX_DIFF_BYTES + 40, strlen( $diff ) );
		$this->assertMatchesRegularExpression( '/… \d+ more lines$/', $diff );
	}

	public function test_proposals_are_kept_out_of_jetpack_sync(): void {
		$this->assertSame( array( 'jp_sitemap', Proposals::POST_TYPE ), Proposals::exclude_from_sync( array( 'jp_sitemap' ) ) );
		$this->assertSame( array( Proposals::POST_TYPE ), Proposals::exclude_from_sync( false ), 'When Sync has no stored setting.' );
	}
}
