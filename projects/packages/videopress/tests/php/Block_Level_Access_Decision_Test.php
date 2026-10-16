<?php
/**
 * Decision-level tests for the VideoPress premium-content block gate.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Exercises the block gate end to end via the public authorization entry point.
 */
class Block_Level_Access_Decision_Test extends BaseTestCase {

	/**
	 * Activate the subscriptions module so the block gate runs, and load the paywall test double.
	 *
	 * Content is inserted as an administrator, or KSES escapes the block-comment JSON; each test then
	 * switches to the visitor it exercises.
	 */
	protected function set_up() {
		parent::set_up();
		// WorDBless otherwise stores KSES-slashed block attributes when changing post ownership.
		kses_remove_filters();
		require_once __DIR__ . '/mocks/premium-content-subscription-service.php';
		add_filter( 'jetpack_active_modules', array( $this, 'activate_subscriptions' ) );
		unset( $GLOBALS['__vp_paywall_received'], $GLOBALS['__vp_paywall_held_plans'], $GLOBALS['__vp_block_gate_received'] );

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'decision_admin',
				'user_pass'  => 'pass',
				'user_email' => 'decision_admin@test.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );
	}

	/**
	 * Clean up filters, globals, users and posts after each test.
	 */
	protected function tear_down() {
		remove_filter( 'jetpack_active_modules', array( $this, 'activate_subscriptions' ) );
		unset( $GLOBALS['__vp_paywall_received'], $GLOBALS['__vp_paywall_held_plans'], $GLOBALS['__vp_block_gate_received'] );
		unset( $_COOKIE[ 'wp-postpass_' . COOKIEHASH ] );
		wp_set_current_user( 0 );
		\WorDBless\Posts::init()->clear_all_posts();
		\WorDBless\Options::init()->clear_options();
	}

	/**
	 * Filter callback: mark the subscriptions module active.
	 *
	 * @param array $active Active module slugs.
	 * @return array
	 */
	public function activate_subscriptions( $active ) {
		$active[] = 'subscriptions';
		return $active;
	}

	/**
	 * The gate requires the plans the stored block configures, whatever plan id the request carries.
	 */
	public function test_gate_uses_plan_from_stored_block() {
		$guid        = 'dEcIsN01';
		$cheap_plan  = 111;
		$pricey_plan = 222;

		$post_id = $this->create_post_with_gated_video( $guid, array( $pricey_plan ) );
		$this->create_private_videopress_attachment( $guid );
		$this->set_current_user_role( 'subscriber' );

		// The visitor holds only the cheap plan, and the request carries that plan id.
		$GLOBALS['__vp_paywall_held_plans'] = array( $cheap_plan );

		$authed = Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, $cheap_plan );

		$this->assertFalse( $authed, 'The gate requires the plan the stored block configures.' );
		$this->assertSame( array( $pricey_plan ), $GLOBALS['__vp_paywall_received']['plan_ids'], 'The gate queries the paywall with the plan from the stored block.' );
		$this->assertSame( $post_id, $GLOBALS['__vp_paywall_received']['post_id'], 'The gate must pass the real embedding post id.' );
	}

	/**
	 * A subscriber holding the plan the block requires is granted.
	 */
	public function test_gate_grants_when_visitor_holds_the_derived_plan() {
		$guid        = 'dEcIsN02';
		$pricey_plan = 222;

		$post_id = $this->create_post_with_gated_video( $guid, array( $pricey_plan ) );
		$this->create_private_videopress_attachment( $guid );
		$this->set_current_user_role( 'subscriber' );

		$GLOBALS['__vp_paywall_held_plans'] = array( $pricey_plan );

		$this->assertTrue(
			Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, 0 ),
			'A subscriber holding the required plan must be granted access.'
		);
	}

	/**
	 * Playback defers to the block's own gate, which is what expands tiers; that expansion is tested
	 * in Jetpack_Premium_Content_Test.
	 */
	public function test_gate_delegates_to_the_shared_block_gate() {
		$guid        = 'dEcIsN04';
		$pricey_plan = 222;

		$post_id = $this->create_post_with_gated_video( $guid, array( $pricey_plan ) );
		$this->create_private_videopress_attachment( $guid );
		$this->set_current_user_role( 'subscriber' );

		$GLOBALS['__vp_paywall_held_plans'] = array( $pricey_plan );

		Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, 0 );

		$this->assertArrayHasKey( '__vp_block_gate_received', $GLOBALS, 'Playback must ask the shared premium-content block gate, not the paywall directly.' );
		$this->assertSame( array( $pricey_plan ), $GLOBALS['__vp_block_gate_received']['plan_ids'], 'The block gate must receive the plans derived from the stored post.' );
		$this->assertSame( $post_id, $GLOBALS['__vp_block_gate_received']['post_id'], 'The block gate must receive the real embedding post id, since this runs outside the loop.' );
	}

	/**
	 * A video wrapped in a premium-content block that configures no plan is denied to a non-editor,
	 * without consulting the paywall.
	 */
	public function test_plan_less_block_denies_non_editor() {
		$guid = 'dEcIsN03';

		$post_id = $this->create_post_with_gated_video( $guid, array() );
		$this->create_private_videopress_attachment( $guid );
		$this->set_current_user_role( 'subscriber' );

		$authed = Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, 0 );

		$this->assertFalse( $authed, 'A plan-less premium-content block denies a non-editor.' );
		$this->assertArrayNotHasKey( '__vp_paywall_received', $GLOBALS, 'A plan-less block must deny outright without querying the paywall.' );
	}

	/**
	 * Paying subscribers are usually logged out, known only by their paywall token, and a logged-out
	 * visitor never has read_post, so the block's own grant must be what admits them.
	 */
	public function test_gate_grants_logged_out_subscriber_holding_the_derived_plan() {
		$guid        = 'dEcIsN05';
		$pricey_plan = 222;

		$post_id = $this->create_post_with_gated_video( $guid, array( $pricey_plan ) );
		$this->create_private_videopress_attachment( $guid );
		wp_set_current_user( 0 );

		$GLOBALS['__vp_paywall_held_plans'] = array( $pricey_plan );

		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, 0 ) );
	}

	/**
	 * A block grant also requires a post the visitor can see.
	 *
	 * @dataProvider provider_non_public_post_status
	 *
	 * @param string $post_status Status of the embedding post.
	 */
	#[DataProvider( 'provider_non_public_post_status' )]
	public function test_gate_denies_subscriber_holding_the_plan_on_a_non_public_post( $post_status ) {
		$guid        = 'dEcIsN06';
		$pricey_plan = 222;

		$post_id = $this->create_post_with_gated_video( $guid, array( $pricey_plan ), $post_status );
		$this->create_private_videopress_attachment( $guid );
		wp_set_current_user( 0 );

		$GLOBALS['__vp_paywall_held_plans'] = array( $pricey_plan );

		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, 0 ) );
	}

	/**
	 * Non-public statuses a post can be in while embedding a video.
	 *
	 * @return array<string, array{string}>
	 */
	public static function provider_non_public_post_status() {
		return array(
			'draft'   => array( 'draft' ),
			'pending' => array( 'pending' ),
			'private' => array( 'private' ),
		);
	}

	/**
	 * Until the visitor enters the post password, the page hides the block from them whether or not
	 * they are logged in, so playback must too.
	 *
	 * @dataProvider provider_visitor_role
	 *
	 * @param string|null $role Role of a logged-in visitor, or null for a logged-out one.
	 */
	#[DataProvider( 'provider_visitor_role' )]
	public function test_gate_denies_subscriber_who_has_not_entered_the_post_password( $role ) {
		$guid        = 'dEcIsN07';
		$pricey_plan = 222;

		$post_id = $this->create_post_with_gated_video( $guid, array( $pricey_plan ), 'publish', 'secret' );
		$this->create_private_videopress_attachment( $guid );
		if ( null === $role ) {
			wp_set_current_user( 0 );
		} else {
			$this->set_current_user_role( $role );
		}

		$GLOBALS['__vp_paywall_held_plans'] = array( $pricey_plan );

		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, 0 ) );
	}

	/**
	 * Visitors checked on a password-protected post.
	 *
	 * @return array<string, array{?string}>
	 */
	public static function provider_visitor_role() {
		return array(
			'logged out' => array( null ),
			'subscriber' => array( 'subscriber' ),
		);
	}

	/**
	 * A subscriber holding the plan who has entered the post password is granted.
	 */
	public function test_gate_grants_subscriber_who_entered_the_post_password() {
		$guid        = 'dEcIsN08';
		$pricey_plan = 222;

		$post_id = $this->create_post_with_gated_video( $guid, array( $pricey_plan ), 'publish', 'secret' );
		$this->create_private_videopress_attachment( $guid );
		wp_set_current_user( 0 );

		require_once ABSPATH . WPINC . '/class-phpass.php';
		$_COOKIE[ 'wp-postpass_' . COOKIEHASH ] = ( new \PasswordHash( 8, true ) )->HashPassword( 'secret' );

		$GLOBALS['__vp_paywall_held_plans'] = array( $pricey_plan );

		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, 0 ) );
	}

	/**
	 * @dataProvider embedding_editor_provider
	 * @param bool  $can_read Whether the editor can read posts.
	 * @param array $plan_ids Plans configured on the stored block.
	 * @param int   $submitted_plan Caller-selected plan.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'embedding_editor_provider' )]
	public function test_embedding_editor_without_subscription_is_denied( $can_read, $plan_ids, $submitted_plan ) {
		$guid    = 'eDiToR01';
		$post_id = $this->create_post_with_gated_video( $guid, $plan_ids );
		$this->create_private_videopress_attachment( $guid );
		$this->set_embedding_editor( $post_id, $can_read );

		$this->assertTrue( current_user_can( 'edit_post', $post_id ) );
		$this->assertSame( $can_read, current_user_can( 'read_post', $post_id ) );
		$this->assertFalse( current_user_can( 'upload_files' ) );
		$this->assertContains( $guid, Access_Control::build_and_cache_post_guids( $post_id ) );
		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, $submitted_plan ) );
	}

	/**
	 * @return array Test cases for editorial capabilities and submitted plans.
	 */
	public static function embedding_editor_provider() {
		$cases = array();
		foreach ( array( false, true ) as $can_read ) {
			foreach ( array( array(), array( 222 ) ) as $plan_ids ) {
				foreach ( array( 0, 111 ) as $submitted_plan ) {
					$key           = ( $can_read ? 'read' : 'no-read' ) . '-' . ( $plan_ids ? 'configured' : 'empty' ) . '-' . $submitted_plan;
					$cases[ $key ] = array( $can_read, $plan_ids, $submitted_plan );
				}
			}
		}
		return $cases;
	}

	/**
	 * A logged-out plan holder is admitted on a public post, so a logged-in one lacking `read` is too.
	 */
	public function test_plan_holder_without_read_is_admitted_on_a_public_post() {
		$guid    = 'eDiToR02';
		$post_id = $this->create_post_with_gated_video( $guid, array( 222 ) );
		$this->create_private_videopress_attachment( $guid );
		$this->set_embedding_editor( $post_id, false );
		$GLOBALS['__vp_paywall_held_plans'] = array( 222 );

		$this->assertFalse( current_user_can( 'read_post', $post_id ) );
		$this->assertContains( $guid, Access_Control::build_and_cache_post_guids( $post_id ) );
		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, 111 ) );
	}

	public function test_subscribed_embedding_editor_with_read_access_is_allowed() {
		$guid    = 'eDiToR03';
		$post_id = $this->create_post_with_gated_video( $guid, array( 222 ) );
		$this->create_private_videopress_attachment( $guid );
		$this->set_embedding_editor( $post_id, true );
		$GLOBALS['__vp_paywall_held_plans'] = array( 222 );

		$this->assertTrue( current_user_can( 'read_post', $post_id ) );
		$this->assertContains( $guid, Access_Control::build_and_cache_post_guids( $post_id ), get_post( $post_id )->post_content );
		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, 111 ) );
	}

	public function test_uploader_can_preview_without_subscription() {
		$guid    = 'eDiToR04';
		$post_id = $this->create_post_with_gated_video( $guid, array() );
		$this->create_private_videopress_attachment( $guid );
		$this->set_current_user_role( 'author' );

		$this->assertTrue( current_user_can( 'upload_files' ) );
		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_id, 111 ) );
		$this->assertArrayNotHasKey( '__vp_paywall_received', $GLOBALS );
	}

	/**
	 * Give an embedding post to a user with editorial capabilities but no upload permission.
	 *
	 * @param int  $post_id Embedding post ID.
	 * @param bool $can_read Whether the user can read posts.
	 */
	private function set_embedding_editor( $post_id, $can_read ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'embedding_editor',
				'user_pass'  => 'pass',
				'role'       => '',
			)
		);
		$user    = get_userdata( $user_id );
		$user->add_cap( 'edit_posts' );
		$user->add_cap( 'edit_published_posts' );
		$user->add_cap( 'read', $can_read );
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_author'  => $user_id,
				'post_content' => get_post( $post_id )->post_content,
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * Build a post embedding $guid inside a premium-content block gated to $plan_ids.
	 *
	 * @param string $guid          The video guid.
	 * @param int[]  $plan_ids      Plan ids for the block (empty for a plan-less block).
	 * @param string $post_status   Post status.
	 * @param string $post_password Post password, if any.
	 * @return int The post id.
	 */
	private function create_post_with_gated_video( $guid, $plan_ids, $post_status = 'publish', $post_password = '' ) {
		$container_open = empty( $plan_ids )
			? '<!-- wp:premium-content/container -->'
			: '<!-- wp:premium-content/container {"selectedPlanIds":[' . implode( ',', array_map( 'intval', $plan_ids ) ) . ']} -->';

		$content = $container_open
			. '<!-- wp:premium-content/subscriber-view -->'
			. '<!-- wp:videopress/video {"guid":"' . $guid . '"} /-->'
			. '<!-- /wp:premium-content/subscriber-view -->'
			. '<!-- /wp:premium-content/container -->';

		return (int) wp_insert_post(
			array(
				'post_title'    => 'Gated video decision',
				'post_content'  => $content,
				'post_status'   => $post_status,
				'post_password' => $post_password,
			)
		);
	}

	/**
	 * Create a private VideoPress attachment discoverable by guid.
	 *
	 * Mirrors Video_Authorization_Test: WorDBless does not emulate the guid meta_query, so seed the
	 * guid->id transient that videopress_get_post_id_by_guid() consults first.
	 *
	 * @param string $guid The VideoPress guid.
	 * @return int The attachment post id.
	 */
	private function create_private_videopress_attachment( $guid ) {
		$attachment_id = (int) wp_insert_post(
			array(
				'post_title'     => $guid,
				'post_status'    => 'inherit',
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
			)
		);
		update_post_meta( $attachment_id, 'videopress_guid', $guid );
		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'videopress' => array(
					'privacy_setting' => \VIDEOPRESS_PRIVACY::IS_PRIVATE,
				),
			)
		);

		set_transient( 'videopress_get_post_id_by_guid_' . $guid, $attachment_id, HOUR_IN_SECONDS );
		wp_cache_delete( 'get_post_by_guid_' . $guid, 'videopress' );

		return $attachment_id;
	}

	/**
	 * Create a user with the given role and set as current user.
	 *
	 * @param string $role The user role.
	 */
	private function set_current_user_role( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $role . '_decision_user',
				'user_pass'  => 'pass',
				'user_email' => $role . '_decision@test.com',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
	}
}
