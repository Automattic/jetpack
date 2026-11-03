<?php
/**
 * Tests for the Jetpack SEO Author_Schema_Node builder.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Author_Schema_Node
 */
#[CoversClass( Author_Schema_Node::class )]
class AuthorSchemaNodeTest extends TestCase {

	/**
	 * Users created during the test.
	 *
	 * @var int[]
	 */
	private $user_ids = array();

	/**
	 * Remove filters and test users.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		remove_all_filters( 'get_avatar_url' );
		wp_set_current_user( 0 );
		foreach ( $this->user_ids as $user_id ) {
			if ( function_exists( 'wp_delete_user' ) ) {
				wp_delete_user( $user_id );
			}
		}
		$_POST = array();
		parent::tearDown();
	}

	/**
	 * Create a WP user.
	 *
	 * @param array $overrides User field overrides.
	 * @return \WP_User
	 */
	private function make_user( array $overrides = array() ) {
		$suffix  = (string) ( count( $this->user_ids ) + 1 ) . '_' . wp_rand();
		$user_id = wp_insert_user(
			array_merge(
				array(
					'user_login'   => 'seo_author_' . $suffix,
					'user_pass'    => 'password',
					'user_email'   => 'seo_author_' . $suffix . '@example.test',
					'display_name' => 'Jane Doe',
				),
				$overrides
			)
		);

		$this->assertIsInt( $user_id );
		$this->user_ids[] = $user_id;
		return get_userdata( $user_id );
	}

	/**
	 * Person maps existing WP user fields plus Jetpack SEO author meta.
	 */
	public function test_person_maps_user_fields_and_author_meta() {
		add_filter(
			'get_avatar_url',
			static function () {
				return 'https://example.test/avatar.jpg';
			}
		);
		$user = $this->make_user(
			array(
				'display_name' => 'Jane Doe',
				'first_name'   => 'Jane',
				'last_name'    => 'Doe',
				'description'  => 'Writes about search.',
				'user_url'     => 'https://example.com/jane/',
			)
		);
		update_user_meta( $user->ID, Author_Schema_Node::META_JOB_TITLE, 'Creator' );
		update_user_meta(
			$user->ID,
			Author_Schema_Node::META_SAME_AS,
			array( 'https://twitter.com/jane', 'https://twitter.com/jane', 'not a url', 'mailto:jane@example.test' )
		);

		$node = Author_Schema_Node::build_person( $user );

		$this->assertSame( 'Person', $node['@type'] );
		$this->assertSame( Schema_Node_Ids::person( $user->ID, $user->user_nicename ), $node['@id'] );
		$this->assertSame( 'Jane Doe', $node['name'] );
		$this->assertSame( 'https://example.test/avatar.jpg', $node['image'] );
		$this->assertSame( 'Writes about search.', $node['description'] );
		$this->assertSame( 'https://example.com/jane/', $node['url'] );
		$this->assertSame( 'Jane', $node['givenName'] );
		$this->assertSame( 'Doe', $node['familyName'] );
		$this->assertSame( 'Creator', $node['jobTitle'] );
		$this->assertSame( array( 'https://twitter.com/jane' ), $node['sameAs'] );
	}

	/**
	 * Empty optional fields are omitted; url falls back to the author archive.
	 */
	public function test_person_omits_empty_optional_fields() {
		$user = $this->make_user();

		$node = Author_Schema_Node::build_person( $user );

		$this->assertSame( 'Jane Doe', $node['name'] );
		$this->assertArrayNotHasKey( 'description', $node );
		$this->assertSame(
			get_author_posts_url( $user->ID, $user->user_nicename ),
			$node['url'],
			'url falls back to the author archive when the Website field is empty.'
		);
		$this->assertArrayNotHasKey( 'givenName', $node );
		$this->assertArrayNotHasKey( 'familyName', $node );
		$this->assertArrayNotHasKey( 'jobTitle', $node );
		$this->assertArrayNotHasKey( 'sameAs', $node );
		$this->assertArrayNotHasKey( 'worksFor', $node );
	}

	/**
	 * `sameAs` keeps only unique absolute http(s) URLs — without resolving DNS,
	 * so a well-formed URL on an unresolvable host is kept.
	 */
	public function test_sanitize_url_list_drops_invalid_and_duplicate_urls() {
		$this->assertSame(
			array( 'https://twitter.com/jane', 'https://bsky.app/profile/jane.example', 'https://unresolvable-host.example/jane' ),
			Author_Schema_Node::sanitize_url_list(
				array(
					'https://twitter.com/jane',
					'',
					'/relative',
					'not a url',
					'javascript:alert(1)',
					'mailto:jane@example.test',
					'https://twitter.com/jane',
					'https://bsky.app/profile/jane.example',
					'https://unresolvable-host.example/jane',
				)
			)
		);
	}

	/**
	 * ProfilePage wraps the Person by `@id`.
	 */
	public function test_profile_page_references_person_as_main_entity() {
		$user = $this->make_user();

		$node = Author_Schema_Node::build_profile_page( $user );

		$this->assertSame( 'ProfilePage', $node['@type'] );
		$this->assertSame( Schema_Node_Ids::profile_page( $user->ID, $user->user_nicename ), $node['@id'] );
		$this->assertSame( get_author_posts_url( $user->ID, $user->user_nicename ), $node['url'] );
		$this->assertSame( Schema_Node_Ids::person( $user->ID, $user->user_nicename ), $node['mainEntity']['@id'] );
	}

	/**
	 * Plugins like PublishPress Authors hand us a queried object that is not a
	 * WP_User; building must bail instead of casting it to user 1.
	 */
	public function test_non_user_object_builds_no_nodes() {
		$this->assertNull( Author_Schema_Node::build_person( new \stdClass() ) );
		$this->assertNull( Author_Schema_Node::build_profile_page( new \stdClass() ) );
	}

	/**
	 * Author meta is registered on users so core's users REST endpoint can read
	 * and write it.
	 */
	public function test_author_meta_is_registered_for_rest() {
		Author_Schema_Node::init();
		$user = $this->make_user();

		$registered = get_registered_meta_keys( 'user' );

		$this->assertSame( 'string', $registered[ Author_Schema_Node::META_JOB_TITLE ]['type'] );
		$this->assertTrue( $registered[ Author_Schema_Node::META_JOB_TITLE ]['show_in_rest'] );
		$this->assertSame( 'array', $registered[ Author_Schema_Node::META_SAME_AS ]['type'] );
		$this->assertSame(
			'array',
			$registered[ Author_Schema_Node::META_SAME_AS ]['show_in_rest']['schema']['type']
		);

		update_user_meta(
			$user->ID,
			Author_Schema_Node::META_SAME_AS,
			array( 'https://example.com/a', 'not a url', 'https://example.com/a' )
		);
		$this->assertSame(
			array( 'https://example.com/a' ),
			get_user_meta( $user->ID, Author_Schema_Node::META_SAME_AS, true )
		);
	}

	/**
	 * Profile saves sanitize, persist, and delete empty Jetpack SEO author meta.
	 */
	public function test_save_profile_fields_sanitizes_and_deletes_author_meta() {
		Author_Schema_Node::init();
		$admin = $this->make_user( array( 'role' => 'administrator' ) );
		$user  = $this->make_user();
		wp_set_current_user( $admin->ID );

		$_POST = array(
			'_wpnonce'                         => wp_create_nonce( 'update-user_' . $user->ID ),
			Author_Schema_Node::META_JOB_TITLE => ' Lead <b>Creator</b> ',
			Author_Schema_Node::META_SAME_AS   => "https://twitter.com/jane\nnot a url\nhttps://twitter.com/jane\nmailto:jane@example.test\nhttps://example.com/jane",
		);
		Author_Schema_Node::save_profile_fields( $user->ID );

		$this->assertSame( 'Lead Creator', get_user_meta( $user->ID, Author_Schema_Node::META_JOB_TITLE, true ) );
		$this->assertSame(
			array( 'https://twitter.com/jane', 'https://example.com/jane' ),
			get_user_meta( $user->ID, Author_Schema_Node::META_SAME_AS, true )
		);

		$_POST = array(
			'_wpnonce'                         => wp_create_nonce( 'update-user_' . $user->ID ),
			Author_Schema_Node::META_JOB_TITLE => '',
			Author_Schema_Node::META_SAME_AS   => '',
		);
		Author_Schema_Node::save_profile_fields( $user->ID );

		$this->assertSame( '', get_user_meta( $user->ID, Author_Schema_Node::META_JOB_TITLE, true ) );
		$this->assertSame( array(), get_user_meta( $user->ID, Author_Schema_Node::META_SAME_AS, true ) );
	}

	/**
	 * @dataProvider profile_write_platforms
	 */
	#[DataProvider( 'profile_write_platforms' )]
	public function test_profile_entry_points_respect_the_plan_without_blocking_regular_fields( $platform, $entitled, $entry_point ) {
		$user = $this->make_user( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		Constants::set_constant( 'IS_WPCOM', 'simple' === $platform );
		Constants::set_constant( 'ATOMIC_SITE_ID', 'atomic' === $platform ? 123 : false );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 'atomic' === $platform ? 456 : false );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', 'atomic' === $platform );
		Status_Cache::clear();
		\Wpcom_Test_Features::$known    = array( 'advanced-seo' );
		\Wpcom_Test_Features::$entitled = $entitled ? array( 'advanced-seo' ) : array();
		Author_Schema_Node::init();
		update_user_meta( $user->ID, Author_Schema_Node::META_JOB_TITLE, 'Stored title' );
		update_user_meta( $user->ID, Author_Schema_Node::META_SAME_AS, array( 'https://example.com/stored' ) );
		$locked         = ! $entitled && 'self-hosted' !== $platform;
		$register_users = static function () {
			( new \WP_REST_Users_Controller() )->register_routes();
		};
		add_action( 'rest_api_init', $register_users );
		try {
			do_action( 'rest_api_init' );
			if ( 'rest' === $entry_point ) {
				$request = new \WP_REST_Request( 'POST', '/wp/v2/users/' . $user->ID );
				$request->set_header( 'Content-Type', 'application/json' );
				$request->set_body(
					wp_json_encode(
						array(
							'meta' => array(
								Author_Schema_Node::META_JOB_TITLE => 'Changed title',
								Author_Schema_Node::META_SAME_AS   => array( 'https://example.com/changed' ),
							),
						),
						JSON_UNESCAPED_SLASHES
					)
				);
				$response = rest_get_server()->dispatch( $request );
				$this->assertSame( $locked ? 403 : 200, $response->get_status() );
			} else {
				$_POST  = array(
					'_wpnonce'                         => wp_create_nonce( 'update-user_' . $user->ID ),
					Author_Schema_Node::META_JOB_TITLE => 'Changed title',
					Author_Schema_Node::META_SAME_AS   => 'https://example.com/changed',
				);
				$errors = new \WP_Error();
				do_action( 'user_profile_update_errors', $errors, true, $user );
				$this->assertSame( $locked ? 'jetpack_seo_plan_required' : '', $errors->get_error_code() );
				Author_Schema_Node::save_profile_fields( $user->ID );
				ob_start();
				Author_Schema_Node::render_profile_fields( $user );
				$html = ob_get_clean();
				$this->assertSame( $locked ? 2 : 0, substr_count( $html, 'disabled=' ) );
				$this->assertSame( $locked, false !== strpos( $html, 'Premium or higher' ) );
			}
			$this->assertSame( $locked ? 'Stored title' : 'Changed title', get_user_meta( $user->ID, Author_Schema_Node::META_JOB_TITLE, true ) );
			$this->assertSame( array( $locked ? 'https://example.com/stored' : 'https://example.com/changed' ), get_user_meta( $user->ID, Author_Schema_Node::META_SAME_AS, true ) );
			$request = new \WP_REST_Request( 'POST', '/wp/v2/users/' . $user->ID );
			$request->set_body_params( array( 'description' => 'Updated ordinary biography.' ) );
			$this->assertSame( 200, rest_get_server()->dispatch( $request )->get_status() );
			$this->assertSame( 'Updated ordinary biography.', get_userdata( $user->ID )->description );
		} finally {
			remove_action( 'rest_api_init', $register_users );
			foreach ( array( 'IS_WPCOM', 'ATOMIC_SITE_ID', 'ATOMIC_CLIENT_ID', 'WPCOMSH__PLUGIN_FILE' ) as $constant ) {
				Constants::clear_single_constant( $constant );
			}
			\Wpcom_Test_Features::reset();
			Status_Cache::clear();
		}
	}

	public static function profile_write_platforms() {
		$cases = array();
		foreach ( array( 'simple', 'atomic', 'self-hosted' ) as $platform ) {
			foreach ( array( false, true ) as $entitled ) {
				foreach ( array( 'rest', 'profile' ) as $entry_point ) {
					$cases[ "$platform $entry_point " . ( $entitled ? 'paid' : 'unpaid' ) ] = array( $platform, $entitled, $entry_point );
				}
			}
		}
		return $cases;
	}
}
