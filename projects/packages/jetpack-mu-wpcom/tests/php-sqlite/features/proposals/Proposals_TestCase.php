<?php
/**
 * Shared fixtures for the Proposals tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposal_Store;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposals;
use PHPUnit\Framework\TestCase;

/**
 * Runs as an administrator without unfiltered_html, as on WordPress.com Simple sites.
 */
abstract class Proposals_TestCase extends TestCase {

	/**
	 * Posts to delete after the test.
	 *
	 * @var int[]
	 */
	protected $post_ids = array();

	/**
	 * Turn the feature on and log in.
	 */
	protected function setUp(): void {
		parent::setUp();
		add_filter( 'jetpack_feature_flag_enabled_' . Proposals::FLAG, '__return_true' );
		add_filter( 'map_meta_cap', array( $this, 'deny_unfiltered_html' ), 10, 2 );
		wp_set_current_user( $this->user( 'administrator' ) );
	}

	/**
	 * Remove posts, proposals and hooks the test added.
	 */
	protected function tearDown(): void {
		$proposals = get_posts(
			array(
				'post_type'        => Proposals::POST_TYPE,
				'post_status'      => array_merge( array_values( Proposal_Store::STATUSES ), array( 'trash' ) ), // 'any' skips internal statuses.
				'numberposts'      => -1,
				'fields'           => 'ids',
				'suppress_filters' => true,
			)
		);
		foreach ( array_merge( $this->post_ids, $proposals ) as $id ) {
			wp_delete_post( $id, true );
		}
		$this->post_ids = array();
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Proposals::FLAG );
		remove_all_filters( 'jetpack_proposals_handlers' );
		remove_all_filters( 'jetpack_proposals_user_has_access' );
		remove_filter( 'map_meta_cap', array( $this, 'deny_unfiltered_html' ), 10 );
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Map unfiltered_html to do_not_allow.
	 *
	 * @param string[] $caps Primitive caps.
	 * @param string   $cap  Requested cap.
	 * @return string[]
	 */
	public function deny_unfiltered_html( $caps, $cap ) {
		return 'unfiltered_html' === $cap ? array( 'do_not_allow' ) : $caps;
	}

	/**
	 * Create a user with a role.
	 *
	 * @param string $role Role.
	 */
	protected function user( string $role ): int {
		return (int) wp_insert_user(
			array(
				'user_login' => wp_unique_id( 'proposals-' ),
				'user_pass'  => 'test',
				'role'       => $role,
			)
		);
	}

	/**
	 * Create a published page.
	 *
	 * @param array $args Post data overrides.
	 */
	protected function create_post( array $args = array() ): int {
		$id = wp_insert_post(
			array_merge(
				array(
					'post_type'    => 'page',
					'post_status'  => 'publish',
					'post_title'   => 'Pricing',
					'post_content' => '<!-- wp:paragraph --><p>Old copy</p><!-- /wp:paragraph -->',
					'post_excerpt' => 'Old excerpt',
				),
				$args
			)
		);

		$this->post_ids[] = $id;
		return $id;
	}

	/**
	 * Create a proposal, failing the test on error.
	 *
	 * @param array $items Requested changes.
	 */
	protected function create_proposal( array $items ): array {
		$result = Proposals::create( 'Refresh pricing', $items );
		$this->assert_not_wp_error( $result );
		return $result['proposal'];
	}

	/**
	 * Assert a value is not a WP_Error.
	 *
	 * @param mixed  $actual  Value.
	 * @param string $message Message.
	 */
	protected function assert_not_wp_error( $actual, string $message = '' ): void {
		$this->assertNotInstanceOf( WP_Error::class, $actual, $message . ( is_wp_error( $actual ) ? ' ' . $actual->get_error_code() . ': ' . $actual->get_error_message() : '' ) );
	}

	/**
	 * Read a proposal the test expects to exist.
	 *
	 * @param int $proposal_id Proposal ID.
	 */
	protected function stored( int $proposal_id ): array {
		$proposal = Proposals::get( $proposal_id );
		$this->assertIsArray( $proposal, "Proposal $proposal_id does not exist." );
		return (array) $proposal;
	}

	/**
	 * Read a proposal's stored payload.
	 *
	 * @param int $proposal_id Proposal ID.
	 */
	protected function stored_payload( int $proposal_id ): array {
		$payload = json_decode( (string) get_post( $proposal_id )->post_content, true );
		$this->assertIsArray( $payload );
		return (array) $payload;
	}

	/**
	 * Assert a value is a WP_Error with a code.
	 *
	 * @param string $code    Expected code.
	 * @param mixed  $actual  Value.
	 * @param string $message Message.
	 */
	protected function assert_wp_error_code( string $code, $actual, string $message = '' ): void {
		$this->assertInstanceOf( WP_Error::class, $actual, $message );
		$this->assertSame( $code, $actual->get_error_code(), $message );
	}

	/**
	 * Overwrite a proposal's stored payload, as a write from outside the feature could.
	 *
	 * @param int    $proposal_id Proposal ID.
	 * @param string $content     New post_content.
	 */
	protected function write_payload_directly( int $proposal_id, string $content ): void {
		global $wpdb;
		$wpdb->update( $wpdb->posts, array( 'post_content' => $content ), array( 'ID' => $proposal_id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		clean_post_cache( $proposal_id );
	}
}
