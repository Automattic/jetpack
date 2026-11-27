<?php
/**
 * Tests for the front-end preview.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Post_Fields_Handler;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposals;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposals_Preview;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;

require_once __DIR__ . '/class-stub-option-handler.php';

/**
 * Routing, overlay, write guard and the preview bar.
 *
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposals_Preview
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Post_Fields_Handler
 * @covers ::jetpack_proposals_init
 */
#[CoversClass( Post_Fields_Handler::class )]
#[CoversClass( Proposals_Preview::class )]
#[CoversFunction( 'jetpack_proposals_init' )]
class Proposals_Preview_Test extends Proposals_TestCase {

	/**
	 * Run the preview router for a request, as a fresh request would.
	 *
	 * @param array $get Query vars.
	 * @return array{proposal: ?array, outdated: bool, handlers: array, died: ?int, redirect: ?string}
	 */
	/**
	 * Hooks as they were before boot() added the preview's.
	 *
	 * @var WP_Hook[]
	 */
	private array $hooks_before = array();

	/**
	 * The request URI before the test.
	 *
	 * @var string|null
	 */
	private ?string $request_uri_before = null;

	/**
	 * Keep a copy of the hooks.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->hooks_before       = array_map( static fn( $hook ) => clone $hook, $GLOBALS['wp_filter'] );
		$this->request_uri_before = $_SERVER['REQUEST_URI'] ?? null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	}

	/**
	 * Drop the hooks and globals a preview added.
	 */
	protected function tearDown(): void {
		$GLOBALS['wp_filter']    = $this->hooks_before; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$GLOBALS['wp_the_query'] = $GLOBALS['wp_query']; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$_SERVER['REQUEST_URI']  = $this->request_uri_before; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$_GET                    = array(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		parent::tearDown();
	}

	private function boot_preview( array $get ): array {
		foreach ( array( 'proposal' => null, 'outdated' => false, 'handlers' => array() ) as $property => $value ) { // phpcs:ignore WordPress.Arrays.ArrayDeclarationSpacing.AssociativeArrayFound
			( new ReflectionProperty( Proposals_Preview::class, $property ) )->setValue( null, $value );
		}
		$died    = null;
		$handler = static function () use ( &$died ) {
			return /** @return never */ static function ( $message, $title, $args ) use ( &$died ) {
				$died = (int) ( $args['response'] ?? 500 );
				throw new RuntimeException( 'died' );
			};
		};
		add_filter( 'wp_die_handler', $handler );
		$redirect   = null;
		$redirector = /** @return never */ static function ( $location ) use ( &$redirect ) {
			$redirect = $location;
			throw new RuntimeException( 'redirected' );
		};
		add_filter( 'wp_redirect', $redirector );

		$_GET = $get; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		try {
			Proposals_Preview::boot();
		} catch ( RuntimeException $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// The die handler and redirect filter throw instead of exiting.
		} finally {
			remove_filter( 'wp_die_handler', $handler );
			remove_filter( 'wp_redirect', $redirector );
			$_GET = array(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}

		return Proposals_Preview::state() + array(
			'died'     => $died,
			'redirect' => $redirect,
		);
	}

	/**
	 * The post-field handler overlaying this preview, if any.
	 *
	 * @param array $state boot_preview() result.
	 */
	private static function overlay( array $state ): ?Post_Fields_Handler {
		return $state['handlers'][ Post_Fields_Handler::TYPE ] ?? null;
	}

	public function test_preview_overlays_only_the_proposed_post(): void {
		$page_id  = $this->create_post();
		$other_id = $this->create_post( array( 'post_title' => 'Other' ) );
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed title',
					'meta'    => array( 'advanced_seo_description' => 'Proposed description' ),
				),
			)
		);

		$overlay = self::overlay( $this->boot_preview( array( Proposals::QUERY_VAR => $proposal['uuid'] ) ) );

		$posts = $overlay->filter_posts_results( array( get_post( $page_id ), get_post( $other_id ) ) );
		$this->assertSame( 'Proposed title', $posts[0]->post_title );
		$this->assertSame( 'Other', $posts[1]->post_title );
		$this->assertSame( 'Pricing', get_post( $page_id )->post_title, 'The cached live post must not be modified.' );
		$this->assertSame( 'Proposed title', get_the_title( $page_id ) );
		$this->assertSame( 'Proposed description', get_post_meta( $page_id, 'advanced_seo_description', true ) );
		$this->assertSame( '', get_post_meta( $other_id, 'advanced_seo_description', true ) );
	}

	public function test_preview_blocks_writes_to_previewed_posts_only(): void {
		$page_id  = $this->create_post();
		$other_id = $this->create_post( array( 'post_title' => 'Other' ) );
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed title',
				),
			)
		);
		update_post_meta( $page_id, '_oembed_test', 'live' );
		$modified = get_post( $page_id )->post_modified_gmt;

		$this->assertNotNull( self::overlay( $this->boot_preview( array( Proposals::QUERY_VAR => $proposal['uuid'] ) ) ) );

		$this->assertSame(
			0,
			wp_update_post(
				array(
					'ID'         => $page_id,
					'post_title' => 'Saved from preview',
				)
			)
		);
		$this->assertFalse( update_post_meta( $page_id, '_oembed_test', 'written during preview' ) );
		$this->assertFalse( add_post_meta( $page_id, '_oembed_new', 'written during preview' ) );
		$this->assertFalse( delete_post_meta( $page_id, '_oembed_test' ) );
		$this->assertSame(
			$other_id,
			wp_update_post(
				array(
					'ID'         => $other_id,
					'post_title' => 'Other edited',
				)
			)
		);
		$this->assertNotFalse( update_post_meta( $other_id, '_oembed_test', 'allowed' ) );
		$this->assertSame( $modified, get_post( $page_id )->post_modified_gmt );
		$this->assertSame( 'live', get_post_meta( $page_id, '_oembed_test', true ) );
	}

	public function test_outdated_proposals_preview_the_live_site_and_say_so(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed title',
				),
			)
		);
		wp_update_post(
			array(
				'ID'         => $page_id,
				'post_title' => 'Edited live',
			)
		);

		$state = $this->boot_preview( array( Proposals::QUERY_VAR => $proposal['uuid'] ) );

		$this->assertTrue( $state['outdated'] );
		$this->assertSame( array(), $state['handlers'] );
		ob_start();
		Proposals_Preview::render_bar();
		$this->assertStringContainsString( 'This proposal is out of date', ob_get_clean() );
	}

	public function test_the_bar_says_the_preview_is_this_page_only_and_links_only_to_the_live_page(): void {
		$proposal               = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Proposed',
				),
			)
		);
		$_SERVER['REQUEST_URI'] = '/pricing/?' . Proposals::QUERY_VAR . '=' . $proposal['uuid'];
		$this->boot_preview( array( Proposals::QUERY_VAR => $proposal['uuid'] ) );

		ob_start();
		Proposals_Preview::render_bar();
		$bar = ob_get_clean();

		$this->assertStringContainsString( 'on this page only', $bar );
		$this->assertStringContainsString( 'Approve or reject the proposal in your chat.', $bar );
		$this->assertSame( 1, preg_match_all( '/<a\s/', $bar ), 'Only the live page link.' );
		$this->assertStringContainsString( 'href="/pricing/"', $bar );
	}

	public function test_preview_routing_only_admits_reviewers_of_every_post(): void {
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Proposed',
				),
			)
		);
		$query    = array( Proposals::QUERY_VAR => $proposal['uuid'] );

		$preview = $this->boot_preview( $query );
		$this->assertSame( $proposal['id'], $preview['proposal']['id'] );
		$this->assertNotNull( self::overlay( $preview ) );

		wp_set_current_user( $this->user( 'author' ) );
		$this->assertSame( 404, $this->boot_preview( $query )['died'], 'An author cannot edit the page.' );

		wp_set_current_user( 0 );
		$logged_out = $this->boot_preview( $query );
		$this->assertNull( $logged_out['proposal'] );
		$this->assertStringContainsString( 'wp-login.php', (string) $logged_out['redirect'], 'Logged out visitors are sent to log in.' );
	}

	public function test_a_token_that_is_not_a_uuid_leaves_the_page_alone_and_an_unknown_one_is_not_found(): void {
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Proposed',
				),
			)
		);

		foreach ( array( (string) $proposal['id'], 'not-a-uuid' ) as $token ) {
			$routed = $this->boot_preview( array( Proposals::QUERY_VAR => $token ) );
			$this->assertNull( $routed['died'], $token );
			$this->assertNull( self::overlay( $routed ), $token );
		}
		$this->assertSame( 404, $this->boot_preview( array( Proposals::QUERY_VAR => wp_generate_uuid4() ) )['died'] );
	}

	public function test_preview_sanitizes_proposed_values_written_outside_proposals(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
					'content' => '<p>Proposed</p>',
					'excerpt' => 'Proposed',
				),
			)
		);

		// Escaped, the tags are not markup to kses when the JSON is saved.
		$script = '\\u003cscript\\u003ealert(1)\\u003c/script\\u003e';
		$stored = str_replace(
			array( '"to":"Proposed"', '"to":"<p>Proposed</p>"' ),
			array( '"to":"' . $script . 'Proposed"', '"to":"' . $script . '<p>Proposed</p>"' ),
			get_post( $proposal['id'] )->post_content
		);
		$this->write_payload_directly( $proposal['id'], $stored );
		$this->assertStringContainsString( '<script>', $this->stored( $proposal['id'] )['items'][0]['change']['fields']['post_content']['to'], 'The decoded payload carries the tag.' );

		$fields = self::overlay( $this->boot_preview( array( Proposals::QUERY_VAR => $proposal['uuid'] ) ) )->previewed_items()[ $page_id ]['change']['fields'];

		foreach ( array( 'post_title', 'post_content', 'post_excerpt' ) as $field ) {
			$this->assertStringNotContainsString( '<script', $fields[ $field ]['to'], $field );
		}
		$this->assertStringContainsString( '<p>Proposed</p>', $fields['post_content']['to'] );
	}

	public function test_closed_proposals_preview_the_live_site(): void {
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Proposed',
				),
			)
		);
		$this->assert_not_wp_error( Proposals::apply( $proposal['id'], $proposal['hash'] ) );

		$preview = $this->boot_preview( array( Proposals::QUERY_VAR => $proposal['uuid'] ) );

		$this->assertSame( 'applied', $preview['proposal']['status'] );
		$this->assertNull( self::overlay( $preview ) );
	}

	public function test_preview_marks_only_the_main_query_as_a_preview(): void {
		global $wp_the_query;
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed title',
				),
			)
		);
		$this->boot_preview( array( Proposals::QUERY_VAR => $proposal['uuid'] ) );

		$main         = new WP_Query();
		$wp_the_query = $main; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Makes this query the main query.
		$main->query( array( 'page_id' => $page_id ) );
		$secondary = new WP_Query( array( 'page_id' => $page_id ) );

		$this->assertTrue( $main->is_preview() );
		$this->assertFalse( $secondary->is_preview() );
		$this->assertSame( 'Proposed title', $main->post->post_title, 'The preview flag must not replace the overlay.' );
	}

	public function test_each_handler_starts_its_preview_once_with_its_own_items(): void {
		$stub = new Stub_Option_Handler();
		add_filter(
			'jetpack_proposals_handlers',
			static function ( $handlers ) use ( $stub ) {
				$handlers[ Stub_Option_Handler::TYPE ] = $stub;
				return $handlers;
			}
		);
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Proposed',
				),
				array(
					'type' => Stub_Option_Handler::TYPE,
					'key'  => 'a',
				),
				array(
					'type' => Stub_Option_Handler::TYPE,
					'key'  => 'b',
				),
			)
		);

		$this->boot_preview( array( Proposals::QUERY_VAR => $proposal['uuid'] ) );

		$this->assertCount( 1, $stub->preview_calls );
		$this->assertSame( array( 'i2', 'i3' ), array_column( $stub->preview_calls[0], 'id' ) );
	}

	public function test_the_entry_file_adds_no_preview_hook_while_the_flag_is_off(): void {
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Proposals::FLAG );
		$_GET[ Proposals::QUERY_VAR ] = wp_generate_uuid4(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		jetpack_proposals_init();

		$this->assertFalse( has_action( 'parse_request', array( Proposals_Preview::class, 'boot' ) ) );
		$this->assertFalse( has_filter( 'option_jetpack_sync_settings_post_types_blacklist', array( Proposals::class, 'exclude_from_sync' ) ) );
	}

	public function test_the_entry_file_boots_the_preview_only_for_proposal_requests(): void {
		jetpack_proposals_init();
		$this->assertFalse( has_action( 'parse_request', array( Proposals_Preview::class, 'boot' ) ), 'An ordinary request.' );
		$this->assertNotFalse( has_filter( 'option_jetpack_sync_settings_post_types_blacklist', array( Proposals::class, 'exclude_from_sync' ) ) );

		$_GET[ Proposals::QUERY_VAR ] = wp_generate_uuid4(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		jetpack_proposals_init();
		$this->assertSame( 20, has_action( 'parse_request', array( Proposals_Preview::class, 'boot' ) ) );
	}
}
