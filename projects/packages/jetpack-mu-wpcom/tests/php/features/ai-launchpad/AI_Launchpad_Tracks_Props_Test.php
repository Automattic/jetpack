<?php
/**
 * Tests for the AI Launchpad Tracks standard properties.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';

/**
 * Test class for the AI Launchpad Tracks standard properties.
 */
class AI_Launchpad_Tracks_Props_Test extends \WorDBless\BaseTestCase {

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
	 */
	private function seed_envelope( $source, $session_id = null ) {
		$envelope = array(
			'version'      => 1,
			'source'       => $source,
			'generated_at' => 1750000000,
			'payload'      => array( 'tasks' => array() ),
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
		$this->assertSame( 'experiment_wpcom_launchpad_personalization_202607_v1', $props['ref'] );
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
	 * The session id is read from the persisted envelope, and an envelope written before the
	 * key existed still reports "none" rather than an empty string.
	 */
	public function test_ai_session_id_is_read_from_the_envelope() {
		$this->seed_envelope( 'ai', 'a755f9e8-8e0a-45be-81bc-524aaf8e2703' );
		$props = wpcom_ai_launchpad_standard_props();
		$this->assertSame( 'a755f9e8-8e0a-45be-81bc-524aaf8e2703', $props['ai_session_id'] );

		$this->seed_envelope( 'ai', '' );
		$props = wpcom_ai_launchpad_standard_props();
		$this->assertSame( 'none', $props['ai_session_id'] );
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
	 * The is_test check is environment-based. A production Atomic site is never a test site,
	 * however the request reached it — that distinction is what is_a11n is for.
	 */
	public function test_is_test_is_environment_based() {
		update_option( 'siteurl', 'https://example.wordpress.com' );
		update_option( 'home', 'https://example.wordpress.com' );
		$this->assertFalse( wpcom_ai_launchpad_is_test() );

		update_option( 'siteurl', 'https://demo.jurassic.ninja' );
		update_option( 'home', 'https://demo.jurassic.ninja' );
		$this->assertTrue( wpcom_ai_launchpad_is_test() );

		update_option( 'siteurl', 'https://copons.jurassic.tube' );
		update_option( 'home', 'https://copons.jurassic.tube' );
		$this->assertTrue( wpcom_ai_launchpad_is_test() );

		// The host match is case-insensitive.
		update_option( 'siteurl', 'https://DEMO.Jurassic.Ninja' );
		update_option( 'home', 'https://DEMO.Jurassic.Ninja' );
		$this->assertTrue( wpcom_ai_launchpad_is_test() );

		// A suffix match, not a substring match: a host that merely contains the marker, before
		// or after the real suffix, is not a test host.
		update_option( 'siteurl', 'https://jurassic.ninja.evil.com' );
		update_option( 'home', 'https://jurassic.ninja.evil.com' );
		$this->assertFalse( wpcom_ai_launchpad_is_test() );

		update_option( 'siteurl', 'https://notjurassic.ninja' );
		update_option( 'home', 'https://notjurassic.ninja' );
		$this->assertFalse( wpcom_ai_launchpad_is_test() );
	}

	/**
	 * A proxied request marks the user, not the environment: is_a11n true, is_test untouched.
	 */
	public function test_is_a11n_on_atomic_follows_the_proxy() {
		update_option( 'siteurl', 'https://example.wordpress.com' );
		update_option( 'home', 'https://example.wordpress.com' );
		Constants::set_constant( 'IS_WPCOM', false );

		$this->assertFalse( wpcom_ai_launchpad_is_a11n() );
		$this->assertFalse( wpcom_ai_launchpad_is_test() );

		Constants::set_constant( 'AT_PROXIED_REQUEST', true );

		$this->assertTrue( wpcom_ai_launchpad_is_a11n() );
		$this->assertFalse( wpcom_ai_launchpad_is_test() );
	}

	/**
	 * The identity bundle exists only on Atomic; on Simple it is always null.
	 */
	public function test_tracks_identity_is_null_on_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->assertNull( wpcom_ai_launchpad_tracks_identity() );
	}

	/**
	 * The shaping step is what actually enforces "no email, no blog id, no locale" — it rebuilds
	 * the array from scratch rather than unsetting keys, so a field the client helper adds later
	 * cannot leak through by default.
	 */
	public function test_shape_tracks_identity_strips_everything_but_id_and_login() {
		$raw = array(
			'blogid'      => 1,
			'email'       => 'someone@example.com',
			'userid'      => 7,
			'username'    => 'copons',
			'user_locale' => 'en',
		);

		$shaped = wpcom_ai_launchpad_shape_tracks_identity( $raw );

		$this->assertSame(
			array(
				'userid'   => 7,
				'username' => 'copons',
			),
			$shaped
		);
		$this->assertArrayNotHasKey( 'email', $shaped );
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
