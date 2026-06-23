<?php
/**
 * Test class for AI_Launchpad_REST.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-rest.php';

use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

/**
 * Test class for AI_Launchpad_REST.
 *
 * @covers \AI_Launchpad_REST
 */
#[CoversClass( AI_Launchpad_REST::class )]
class AI_Launchpad_REST_Test extends \WorDBless\BaseTestCase {
	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( true );

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_admin',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);

		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'dummy_subscriber',
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);

		wp_set_current_user( 0 );
		// Register the launchpad checklists before the REST server is created, so the legacy
		// launchpad endpoint registers its route args from a populated task registry.
		wpcom_register_default_launchpad_checklists();
		do_action( 'rest_api_init' );
	}

	/**
	 * Reverting the testing environment to its original state.
	 */
	public function tear_down() {
		\Brain\Monkey\tearDown();
	}

	/**
	 * A schema-valid `PUT /tailored` body with six catalog task IDs ending on a launch task.
	 *
	 * @return array
	 */
	private static function valid_payload() {
		return array(
			'tasks'            => array(
				array(
					'id'       => 'first_post_published',
					'subtitle' => 'Share your first trail story.',
				),
				array(
					'id'       => 'design_edited',
					'subtitle' => 'Make the design fit your hikes.',
				),
				array(
					'id'       => 'site_title',
					'subtitle' => 'Name your alpine journal.',
				),
				array(
					'id'       => 'setup_free',
					'subtitle' => 'Personalize your site basics.',
				),
				array(
					'id'       => 'site_theme_selected',
					'subtitle' => 'Pick a theme for mountain photos.',
				),
				array(
					'id'       => 'site_launched',
					'subtitle' => 'Go live and share your journey.',
				),
			),
			'inferred'         => array(
				'goal'       => 'write',
				'brand_name' => 'Alpine Notes',
			),
			'first_post_draft' => array(
				'title'      => 'First steps on the trail',
				'paragraphs' => array( 'First paragraph.', 'Second paragraph.' ),
			),
		);
	}

	/**
	 * Performs a REST request against an AI Launchpad route.
	 *
	 * @param string     $method The HTTP method.
	 * @param string     $route  Route suffix, e.g. '' or '/wizard'.
	 * @param null|array $body   JSON body.
	 * @param null|array $query  Query params.
	 * @return WP_REST_Response
	 */
	private function call_api( $method, $route = '', $body = null, $query = null ) {
		$request = new WP_REST_Request( $method, '/wpcom/v2/ai-launchpad' . $route );
		$request->set_header( 'content_type', 'application/json' );

		if ( null !== $body ) {
			$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}

		if ( null !== $query ) {
			$request->set_query_params( $query );
		}

		return rest_do_request( $request );
	}

	/**
	 * Test that GET returns the composite shape with enriched tasks.
	 */
	public function test_get_returns_composite_shape() {
		wp_set_current_user( $this->admin_id );

		$wizard = array(
			'version'      => 1,
			'goal'         => 'write',
			'site_name'    => 'Alpine Notes',
			'description'  => 'Personal blog about long-distance hiking in the Alps.',
			'locale'       => 'en',
			'generated_at' => 1717000000,
		);
		update_option( 'wpcom_ai_launchpad_wizard', $wizard, false );

		$ai_output = array(
			'version'      => 1,
			'source'       => 'ai',
			'generated_at' => 1717000000,
			'payload'      => self::valid_payload(),
		);
		update_option( 'wpcom_ai_launchpad_ai_output', $ai_output, false );
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );

		$result = $this->call_api( Requests::GET );

		$this->assertSame( 200, $result->get_status() );

		$data = $result->get_data();
		$this->assertSame( $wizard, $data['wizard'] );
		$this->assertSame( $ai_output, $data['ai_output'] );
		$this->assertSame( array( 'first_post_published' => true ), $data['checklist_statuses'] );
		$this->assertFalse( $data['dismissed'] );
		$this->assertTrue( $data['is_eligible'] );
		// Site context for the client (launch CTA slug + preview thumbnail/label
		// + wizard Name/Brief-description pre-fill).
		$this->assertSame( home_url(), $data['site']['url'] );
		$this->assertSame( get_bloginfo( 'name' ), $data['site']['title'] );
		$this->assertSame( get_bloginfo( 'description' ), $data['site']['description'] );

		$this->assertCount( 6, $data['tasks'] );

		$first_task = $data['tasks'][0];
		$this->assertSame( 'first_post_published', $first_task['id'] );
		$this->assertSame( 'Share your first trail story.', $first_task['subtitle'] );
		$this->assertSame( 'Write your first post', $first_task['title'] );
		$this->assertTrue( $first_task['completed'] );
		$this->assertSame( admin_url( 'post-new.php' ), $first_task['calypso_path'] );

		$last_task = $data['tasks'][5];
		$this->assertSame( 'site_launched', $last_task['id'] );
		$this->assertSame( 'Launch your site', $last_task['title'] );
		$this->assertFalse( $last_task['completed'] );
		$this->assertNull( $last_task['calypso_path'] );
	}

	/**
	 * Test that GET drops tasks the catalog would hide on this site (is_visible_callback),
	 * while keeping the visible ones. WooCommerce tasks are gated to WoA sites with
	 * WooCommerce active, so woo_products is not visible in the test environment.
	 */
	public function test_get_excludes_non_visible_tasks() {
		wp_set_current_user( $this->admin_id );

		$payload          = self::valid_payload();
		$payload['tasks'] = array(
			array(
				'id'       => 'first_post_published',
				'subtitle' => 'Share your first trail story.',
			),
			array(
				'id'       => 'woo_products',
				'subtitle' => 'Add your first product.',
			),
			array(
				'id'       => 'site_launched',
				'subtitle' => 'Go live and share your journey.',
			),
		);

		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => $payload,
			),
			false
		);

		$result = $this->call_api( Requests::GET );

		$this->assertSame( 200, $result->get_status() );

		$ids = array_column( $result->get_data()['tasks'], 'id' );
		$this->assertContains( 'first_post_published', $ids );
		$this->assertContains( 'site_launched', $ids );
		$this->assertNotContains( 'woo_products', $ids );
	}

	/**
	 * Test that GET requires authentication.
	 */
	public function test_get_requires_authentication() {
		$result = $this->call_api( Requests::GET );

		$this->assertSame( 401, $result->get_status() );
	}

	/**
	 * Test that ineligible sites get a 404.
	 */
	public function test_ineligible_site_gets_404() {
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( false );
		wp_set_current_user( $this->admin_id );

		$result = $this->call_api( Requests::GET );

		$this->assertSame( 404, $result->get_status() );
		$this->assertSame( 'ai_launchpad_not_eligible', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /wizard persists the wizard option.
	 */
	public function test_put_wizard_persists_option() {
		wp_set_current_user( $this->admin_id );

		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'write',
				'site_name'   => 'Alpine Notes',
				'description' => 'Personal blog about long-distance hiking in the Alps.',
				'locale'      => 'en',
			)
		);

		$this->assertSame( 200, $result->get_status() );

		$option = get_option( 'wpcom_ai_launchpad_wizard' );
		$this->assertIsArray( $option );
		$this->assertSame( 1, $option['version'] );
		$this->assertSame( 'write', $option['goal'] );
		$this->assertSame( 'Alpine Notes', $option['site_name'] );
		$this->assertSame( 'Personal blog about long-distance hiking in the Alps.', $option['description'] );
		$this->assertSame( 'en', $option['locale'] );
		$this->assertIsInt( $option['generated_at'] );

		// The entered Name and Brief description are written back to the site's
		// identity options so the wizard reflects and updates the real site.
		$this->assertSame( 'Alpine Notes', get_option( 'blogname' ) );
		$this->assertSame( 'Personal blog about long-distance hiking in the Alps.', get_option( 'blogdescription' ) );
	}

	/**
	 * Test that PUT /wizard does not blank an existing site title/tagline when the
	 * Name and Brief description come through empty.
	 */
	public function test_put_wizard_keeps_site_identity_when_fields_empty() {
		wp_set_current_user( $this->admin_id );

		update_option( 'blogname', 'Existing Title' );
		update_option( 'blogdescription', 'Existing Tagline' );

		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'write',
				'site_name'   => '',
				'description' => '',
				'locale'      => 'en',
			)
		);

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'Existing Title', get_option( 'blogname' ) );
		$this->assertSame( 'Existing Tagline', get_option( 'blogdescription' ) );
	}

	/**
	 * Test that a multi-line Brief description is collapsed to a single-line tagline.
	 */
	public function test_put_wizard_collapses_multiline_description_for_tagline() {
		wp_set_current_user( $this->admin_id );

		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'write',
				'site_name'   => 'Alpine Notes',
				'description' => "Line one.\nLine two.",
				'locale'      => 'en',
			)
		);

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'Line one. Line two.', get_option( 'blogdescription' ) );
	}

	/**
	 * Test that PUT /wizard rejects an unknown goal.
	 */
	public function test_put_wizard_rejects_unknown_goal() {
		wp_set_current_user( $this->admin_id );

		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'world-domination',
				'site_name'   => 'Alpine Notes',
				'description' => 'A blog.',
			)
		);

		$this->assertSame( 400, $result->get_status() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_wizard' ) );
	}

	/**
	 * Test that PUT /tailored persists the wrapped envelope.
	 */
	public function test_put_tailored_persists_wrapped_envelope() {
		wp_set_current_user( $this->admin_id );

		$payload = self::valid_payload();
		$result  = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 200, $result->get_status() );

		$option = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertIsArray( $option );
		$this->assertSame( 1, $option['version'] );
		$this->assertSame( 'ai', $option['source'] );
		$this->assertIsInt( $option['generated_at'] );
		$this->assertSame( $payload, $option['payload'] );
	}

	/**
	 * Test that PUT /tailored records the fallback source from the query param.
	 */
	public function test_put_tailored_records_fallback_source() {
		wp_set_current_user( $this->admin_id );

		$result = $this->call_api( 'PUT', '/tailored', self::valid_payload(), array( 'source' => 'fallback' ) );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'fallback', get_option( 'wpcom_ai_launchpad_ai_output' )['source'] );
	}

	/**
	 * Test that PUT /tailored rejects a seventh task.
	 */
	public function test_put_tailored_rejects_extra_task() {
		wp_set_current_user( $this->admin_id );

		$payload            = self::valid_payload();
		$payload['tasks'][] = array(
			'id'       => 'drive_traffic',
			'subtitle' => 'One task too many.',
		);

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_invalid_payload', $result->get_data()['code'] );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_ai_output' ) );
	}

	/**
	 * Test that PUT /tailored rejects a payload missing a required field.
	 */
	public function test_put_tailored_rejects_missing_required_field() {
		wp_set_current_user( $this->admin_id );

		$payload = self::valid_payload();
		unset( $payload['first_post_draft'] );

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_invalid_payload', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /tailored strips HTML from subtitles before persisting.
	 */
	public function test_put_tailored_strips_html_from_subtitles() {
		wp_set_current_user( $this->admin_id );

		$payload                         = self::valid_payload();
		$payload['tasks'][0]['subtitle'] = 'Share your <b>first</b> trail story.';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 200, $result->get_status() );

		$option = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertSame( 'Share your first trail story.', $option['payload']['tasks'][0]['subtitle'] );
	}

	/**
	 * Test that PUT /tailored rejects a subtitle that is only a script tag.
	 */
	public function test_put_tailored_rejects_script_only_subtitle() {
		wp_set_current_user( $this->admin_id );

		$payload                         = self::valid_payload();
		$payload['tasks'][0]['subtitle'] = '<script>alert(1)</script>';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_invalid_subtitle', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /tailored rejects a subtitle containing a URL.
	 */
	public function test_put_tailored_rejects_subtitle_with_url() {
		wp_set_current_user( $this->admin_id );

		$payload                         = self::valid_payload();
		$payload['tasks'][0]['subtitle'] = 'Visit https://example.com for tips.';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_subtitle_contains_url', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /tailored rejects a subtitle containing template syntax.
	 */
	public function test_put_tailored_rejects_subtitle_with_template_syntax() {
		wp_set_current_user( $this->admin_id );

		$payload                         = self::valid_payload();
		$payload['tasks'][0]['subtitle'] = 'Write about {{brand_name}} today.';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_subtitle_contains_template', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /tailored rejects a payload with fewer than four catalog-valid task IDs.
	 */
	public function test_put_tailored_rejects_too_few_catalog_valid_tasks() {
		wp_set_current_user( $this->admin_id );

		$payload                   = self::valid_payload();
		$payload['tasks'][1]['id'] = 'made_up_task_one';
		$payload['tasks'][2]['id'] = 'made_up_task_two';
		$payload['tasks'][3]['id'] = 'made_up_task_three';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_unknown_tasks', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /tailored drops unknown task IDs but persists when enough survive.
	 */
	public function test_put_tailored_drops_unknown_task_ids() {
		wp_set_current_user( $this->admin_id );

		$payload                   = self::valid_payload();
		$payload['tasks'][1]['id'] = 'made_up_task';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 200, $result->get_status() );

		$persisted_tasks = get_option( 'wpcom_ai_launchpad_ai_output' )['payload']['tasks'];
		$this->assertCount( 5, $persisted_tasks );
		$this->assertNotContains( 'made_up_task', array_column( $persisted_tasks, 'id' ) );
	}

	/**
	 * Test that PUT /tailored rejects a payload whose last task is not a launch task.
	 */
	public function test_put_tailored_rejects_when_last_task_is_not_launch_task() {
		wp_set_current_user( $this->admin_id );

		$payload                   = self::valid_payload();
		$payload['tasks'][5]['id'] = 'drive_traffic';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_missing_launch_task', $result->get_data()['code'] );
	}

	/**
	 * Test that subscriber-role users are denied on every endpoint.
	 */
	public function test_subscriber_is_denied() {
		wp_set_current_user( $this->subscriber_id );

		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'write',
				'site_name'   => 'Alpine Notes',
				'description' => 'A blog.',
			)
		);
		$this->assertSame( 403, $result->get_status() );

		$result = $this->call_api( 'PUT', '/tailored', self::valid_payload() );
		$this->assertSame( 403, $result->get_status() );

		$result = $this->call_api( Requests::DELETE );
		$this->assertSame( 403, $result->get_status() );

		$result = $this->call_api( Requests::GET );
		$this->assertSame( 403, $result->get_status() );

		$this->assertFalse( get_option( 'wpcom_ai_launchpad_wizard' ) );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_ai_output' ) );
	}

	/**
	 * Test that DELETE removes the AI output, sets dismissed, and leaves statuses untouched.
	 */
	public function test_delete_dismisses_and_keeps_statuses() {
		wp_set_current_user( $this->admin_id );

		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => self::valid_payload(),
			),
			false
		);
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );

		$result = $this->call_api( Requests::DELETE );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array( 'dismissed' => true ), $result->get_data() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_ai_output' ) );
		$this->assertTrue( (bool) get_option( 'wpcom_ai_launchpad_dismissed' ) );
		$this->assertSame( array( 'first_post_published' => true ), get_option( 'launchpad_checklist_tasks_statuses' ) );
	}
}
