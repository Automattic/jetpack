<?php
/**
 * Tests for the AI Launchpad Tracks standard properties.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\DataProvider;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';

/**
 * Test class for the AI Launchpad Tracks standard properties.
 */
class AI_Launchpad_Tracks_Props_Test extends \WorDBless\BaseTestCase {

	/**
	 * The props of each event recorded during a test.
	 *
	 * @var array[]
	 */
	private $recorded = array();

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Constants::clear_constants();
		delete_option( 'wpcom_ai_launchpad_ai_output' );
		parent::tear_down();
	}

	/**
	 * Persists a tailored envelope with the given source and session id.
	 *
	 * @param string      $source     'ai' or 'fallback'.
	 * @param string|null $session_id The session id to persist, or null to omit the key.
	 * @param array       $inferred   The payload's `inferred` block.
	 */
	private function seed_envelope( $source, $session_id = null, $inferred = array() ) {
		$envelope = array(
			'version'      => 1,
			'source'       => $source,
			'generated_at' => 1750000000,
			'payload'      => array(
				'tasks'    => array(),
				'inferred' => $inferred,
			),
		);
		if ( null !== $session_id ) {
			$envelope['ai_session_id'] = $session_id;
		}
		update_option( 'wpcom_ai_launchpad_ai_output', $envelope, false );
	}

	/**
	 * The constant properties never vary.
	 */
	public function test_constant_props() {
		$props = wpcom_ai_launchpad_standard_props();

		$this->assertSame( 'web', $props['channel'] );
		$this->assertSame( 'dashboard', $props['surface'] );
		$this->assertSame( 'admin.php', $props['screen'] );
		$this->assertSame( 'ai_launchpad', $props['ref'] );
		$this->assertSame( 'ai_launchpad', $props['agent_name'] );
		$this->assertSame( \Automattic\Jetpack\Jetpack_Mu_Wpcom::PACKAGE_VERSION, $props['agent_version'] );
	}

	/**
	 * Before tailoring has run, the three tailoring-scoped props report the string "none",
	 * never null: null breaks group-by aggregations downstream.
	 */
	public function test_tailoring_props_default_to_none() {
		$props = wpcom_ai_launchpad_standard_props();

		$this->assertSame( 'none', $props['source'] );
		$this->assertSame( 'none', $props['outcome'] );
		$this->assertSame( 'none', $props['ai_session_id'] );
	}

	/**
	 * An AI-sourced list reports outcome success; the fallback reports error.
	 */
	public function test_outcome_is_derived_from_source() {
		$this->seed_envelope( 'ai' );
		$props = wpcom_ai_launchpad_standard_props();
		$this->assertSame( 'ai', $props['source'] );
		$this->assertSame( 'success', $props['outcome'] );

		$this->seed_envelope( 'fallback' );
		$props = wpcom_ai_launchpad_standard_props();
		$this->assertSame( 'fallback', $props['source'] );
		$this->assertSame( 'error', $props['outcome'] );
	}

	/**
	 * The session id is read from the persisted envelope, and an empty or missing one reports "none".
	 */
	public function test_ai_session_id_is_read_from_the_envelope() {
		$this->seed_envelope( 'ai', 'a755f9e8-8e0a-45be-81bc-524aaf8e2703' );
		$this->assertSame( 'a755f9e8-8e0a-45be-81bc-524aaf8e2703', wpcom_ai_launchpad_standard_props()['ai_session_id'] );

		$this->seed_envelope( 'ai', '' );
		$this->assertSame( 'none', wpcom_ai_launchpad_standard_props()['ai_session_id'] );

		$this->seed_envelope( 'ai' );
		$this->assertSame( 'none', wpcom_ai_launchpad_standard_props()['ai_session_id'] );
	}

	/**
	 * The site_type prop reports the hosting platform, not the kind of site the user is building.
	 */
	public function test_site_type_follows_the_platform() {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->assertSame( 'simple', wpcom_ai_launchpad_standard_props()['site_type'] );

		Constants::set_constant( 'IS_WPCOM', false );
		$this->assertSame( 'atomic', wpcom_ai_launchpad_standard_props()['site_type'] );
	}

	/**
	 * The is_test check is environment-based: a test host matches by suffix, case-insensitively.
	 *
	 * @dataProvider provide_site_urls
	 *
	 * @param string $url      The site URL.
	 * @param bool   $expected Whether the site is a test site.
	 */
	#[DataProvider( 'provide_site_urls' )]
	public function test_is_test_is_environment_based( $url, $expected ) {
		update_option( 'siteurl', $url );

		$this->assertSame( $expected, wpcom_ai_launchpad_is_test() );
	}

	/**
	 * Data provider for test_is_test_is_environment_based.
	 *
	 * @return array
	 */
	public static function provide_site_urls() {
		return array(
			'a production site'                   => array( 'https://example.wordpress.com', false ),
			'Jurassic Ninja'                      => array( 'https://demo.jurassic.ninja', true ),
			'Jurassic Tube'                       => array( 'https://copons.jurassic.tube', true ),
			'a mixed-case host'                   => array( 'https://DEMO.Jurassic.Ninja', true ),
			'the marker before the real suffix'   => array( 'https://jurassic.ninja.evil.com', false ),
			'the marker glued onto another label' => array( 'https://notjurassic.ninja', false ),
		);
	}

	/**
	 * A proxied request marks the user, not the environment: is_a11n true, is_test untouched.
	 */
	public function test_is_a11n_on_atomic_follows_the_proxy() {
		update_option( 'siteurl', 'https://example.wordpress.com' );
		Constants::set_constant( 'IS_WPCOM', false );

		$this->assertFalse( wpcom_ai_launchpad_is_a11n() );
		$this->assertFalse( wpcom_ai_launchpad_is_test() );

		Constants::set_constant( 'AT_PROXIED_REQUEST', true );

		$this->assertTrue( wpcom_ai_launchpad_is_a11n() );
		$this->assertFalse( wpcom_ai_launchpad_is_test() );
	}

	/**
	 * `is_test` and `is_a11n` are stringified to 'true'/'false' in the props, never PHP bools.
	 */
	public function test_is_test_and_is_a11n_are_stringified_in_props() {
		update_option( 'siteurl', 'https://example.wordpress.com' );
		Constants::set_constant( 'IS_WPCOM', false );

		$props = wpcom_ai_launchpad_standard_props();
		$this->assertSame( 'false', $props['is_test'] );
		$this->assertSame( 'false', $props['is_a11n'] );

		update_option( 'siteurl', 'https://demo.jurassic.ninja' );
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );

		$props = wpcom_ai_launchpad_standard_props();
		$this->assertSame( 'true', $props['is_test'] );
		$this->assertSame( 'true', $props['is_a11n'] );
	}

	/**
	 * The shared context is all-null with no persisted state, falls back to the wizard goal before tailoring,
	 * and reads the inferred fields once tailoring has run.
	 */
	public function test_tracks_context_reads_the_persisted_options() {
		$this->assertSame(
			array(
				'goal'           => null,
				'niche'          => null,
				'theme_category' => null,
				'vibe'           => null,
				'audience'       => null,
				'rendered_list'  => null,
				'inferred_goal'  => null,
			),
			wpcom_ai_launchpad_tracks_context()
		);

		update_option( 'wpcom_ai_launchpad_wizard', array( 'goal' => 'sell' ), false );
		$this->assertSame( 'sell', wpcom_ai_launchpad_tracks_context()['goal'] );

		$this->seed_envelope(
			'ai',
			null,
			array(
				'goal'           => 'write',
				'niche'          => 'hiking',
				'theme_category' => 'travel-lifestyle',
				'inferred_goal'  => 'portfolio',
			)
		);
		$context = wpcom_ai_launchpad_tracks_context( array( 'a', 'b' ) );
		$this->assertSame( 'write', $context['goal'] );
		$this->assertSame( 'hiking', $context['niche'] );
		$this->assertSame( 'travel-lifestyle', $context['theme_category'] );
		$this->assertSame( 'portfolio', $context['inferred_goal'] );
		$this->assertNull( $context['vibe'] );
		$this->assertSame( '["a","b"]', $context['rendered_list'] );
	}

	/**
	 * A recorded event carries the standard props and the non-null context, and a call-site prop beats a
	 * standard prop of the same name.
	 */
	public function test_record_tracks_event_merges_the_props() {
		$this->seed_envelope( 'ai', null, array( 'goal' => 'write' ) );
		add_action(
			'wpcom_ai_launchpad_tracks_event',
			function ( $name, $props ) {
				$this->recorded[] = $props;
			},
			10,
			2
		);

		wpcom_ai_launchpad_record_tracks_event( 'jetpack_ai_launchpad_task_completed', array( 'surface' => 'somewhere_else' ) );

		$this->assertCount( 1, $this->recorded );
		$props = $this->recorded[0];
		$this->assertSame( 'somewhere_else', $props['surface'] );
		$this->assertSame( 'web', $props['channel'] );
		$this->assertSame( 'write', $props['goal'] );
		$this->assertArrayNotHasKey( 'niche', $props );
	}

	/**
	 * The identity bundle exists only on Atomic; on Simple it is always null.
	 */
	public function test_tracks_identity_is_null_on_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->assertNull( wpcom_ai_launchpad_tracks_identity() );
	}

	/**
	 * The shaping step rebuilds the identity from scratch, so a field the client helper adds later cannot leak.
	 */
	public function test_shape_tracks_identity_strips_everything_but_id_and_login() {
		$raw = array(
			'blogid'      => 1,
			'email'       => 'someone@example.com',
			'userid'      => 7,
			'username'    => 'copons',
			'user_locale' => 'en',
		);

		$this->assertSame(
			array(
				'userid'   => 7,
				'username' => 'copons',
			),
			wpcom_ai_launchpad_shape_tracks_identity( $raw )
		);
	}

	/**
	 * An identity that isn't usable — no connected user, or a partial record — shapes to null.
	 */
	public function test_shape_tracks_identity_is_null_for_unusable_input() {
		$this->assertNull( wpcom_ai_launchpad_shape_tracks_identity( false ) );
		$this->assertNull( wpcom_ai_launchpad_shape_tracks_identity( array( 'username' => 'copons' ) ) );
		$this->assertNull( wpcom_ai_launchpad_shape_tracks_identity( array( 'userid' => 7 ) ) );
	}
}
