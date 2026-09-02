<?php
/**
 * Tests for the Jetpack_AI_Settings gate/option registry.
 *
 * The contract worth locking down: the master-gate callback is restrictive-only
 * (it may turn a yes into a no, never the reverse, because jetpack_ai_enabled is
 * applied with different defaults at different call sites), the host gate
 * (WP_AI_SUPPORT / wp_supports_ai()) and master option flow into every AI filter,
 * and per-feature toggles honor their options, filters, and parent dependencies.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Class Jetpack_AI_Settings_Test
 *
 * @covers \Jetpack_AI_Settings
 */
#[CoversClass( Jetpack_AI_Settings::class )]
class Jetpack_AI_Settings_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Filter callback used to simulate the `ai` module being active without the
	 * connection/plan setup a real activation needs. Applied after the module
	 * availability intersection in Modules::get_active(), so it forces the state.
	 *
	 * @var callable|null
	 */
	private $force_ai_active_filter = null;

	/**
	 * Off-Simple, the `ai` module is the master switch. Force it active so the
	 * master reads as on, mirroring the option-default-on baseline the gate
	 * tests assume.
	 */
	private function force_ai_module_active() {
		$this->force_ai_active_filter = static function ( $modules ) {
			$modules[] = 'ai';
			return $modules;
		};
		add_filter( 'jetpack_active_modules', $this->force_ai_active_filter );
	}

	/**
	 * Reset the options and filters this test touches.
	 */
	public function tear_down() {
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		delete_option( Jetpack_AI_Settings::MASTER_OPTION );
		foreach ( Jetpack_AI_Settings::FEATURE_OPTIONS as $option ) {
			delete_option( $option );
		}
		remove_filter( 'jetpack_ai_writing_assistant_enabled', '__return_false' );
		remove_filter( 'wp_supports_ai', '__return_false' );
		remove_filter( 'jetpack_ai_enabled', '__return_true', PHP_INT_MAX );
		remove_filter( 'jetpack_ai_enabled', '__return_true', 11 );
		remove_filter( 'jetpack_is_connection_ready', '__return_true' );

		if ( $this->force_ai_active_filter !== null ) {
			remove_filter( 'jetpack_active_modules', $this->force_ai_active_filter );
			$this->force_ai_active_filter = null;
		}

		// Reset the platform: every test in this class defaults to off-Simple.
		Constants::clear_single_constant( 'IS_WPCOM' );
		\Jetpack_Options::update_option( 'active_modules', array() );

		parent::tear_down();
	}

	/**
	 * Loading the settings class registers every master-gate filter.
	 */
	public function test_class_self_initializes_on_load() {
		$callback = array( Jetpack_AI_Settings::class, 'apply_master_gates' );

		$this->assertNotFalse( has_filter( 'jetpack_ai_enabled', $callback ) );
		$this->assertNotFalse( has_filter( 'jetpack_search_ai_answers_enabled', $callback ) );
		$this->assertNotFalse( has_filter( 'jetpack_ai_sidebar_enabled', $callback ) );
		$this->assertNotFalse( has_filter( 'jetpack_ai_seo_enabled', $callback ) );
	}

	/**
	 * The master gate must never turn a no into a yes: call sites pass their own
	 * computed default (false on plain self-hosted sites in Jetpack_AI_Helper).
	 */
	public function test_master_gate_is_restrictive_only() {
		// Host allows; make the master on. Off-Simple the master is the `ai`
		// module, so activate it rather than the option.
		$this->force_ai_module_active();

		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', false ), 'A call-site false must survive the gate.' );
		$this->assertTrue( apply_filters( 'jetpack_ai_enabled', true ), 'A call-site true must pass when every gate is open.' );
	}

	/**
	 * Master off (off-Simple: the `ai` module inactive) turns off every AI filter
	 * the settings class guards.
	 */
	public function test_master_off_disables_ai_filters() {
		// Off-Simple, the module is the master and is inactive by default here.
		$this->assertFalse( Jetpack_AI_Settings::is_master_enabled() );
		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', true ) );
		$this->assertFalse( apply_filters( 'jetpack_search_ai_answers_enabled', true ) );
		$this->assertFalse( apply_filters( 'jetpack_ai_sidebar_enabled', true ) );
		$this->assertFalse( apply_filters( 'jetpack_ai_seo_enabled', true ) );
	}

	/**
	 * The master switch takes effect for everyone, with no proxy and no internal
	 * testing hostname: an inactive `ai` module turns AI off.
	 */
	public function test_master_enforced_for_an_ordinary_visitor() {
		$this->assertFalse( jetpack_is_internal_testing_environment(), 'Precondition: an ordinary environment.' );
		$this->assertFalse( Jetpack_AI_Settings::is_master_enabled(), 'Precondition: the stored master state reads off.' );

		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', true ) );
		$this->assertFalse( apply_filters( 'jetpack_search_ai_answers_enabled', true ) );
		$this->assertFalse( apply_filters( 'jetpack_ai_sidebar_enabled', true ) );
		$this->assertFalse( apply_filters( 'jetpack_ai_seo_enabled', true ) );
		$this->assertFalse( Jetpack_AI_Settings::is_ai_enabled() );
		$this->assertFalse( Jetpack_AI_Settings::is_ai_seo_enabled() );
	}

	/**
	 * The host gate (a server-owner decision) keeps enforcing everywhere.
	 */
	public function test_host_gate_enforced_for_an_ordinary_visitor() {
		if ( ! function_exists( 'wp_supports_ai' ) ) {
			$this->markTestSkipped( 'wp_supports_ai() is not available in this WordPress version.' );
		}

		add_filter( 'wp_supports_ai', '__return_false' );

		$this->assertFalse( Jetpack_AI_Settings::is_ai_enabled() );
		$this->assertFalse( Jetpack_AI_Settings::is_ai_seo_enabled() );
	}

	/**
	 * The waiver is an off-Simple concern: WordPress.com Simple keeps its
	 * existing contract, where the master option enforces regardless of the
	 * internal-testing predicate.
	 */
	public function test_master_option_enforced_on_wpcom_simple_regardless_of_env() {
		Constants::set_constant( 'IS_WPCOM', true );
		update_option( Jetpack_AI_Settings::MASTER_OPTION, 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_ai_enabled() );
		$this->assertFalse( Jetpack_AI_Settings::is_ai_seo_enabled() );
	}

	/**
	 * The master gate is final in is_ai_enabled(). A callback registered at the
	 * latest possible priority can override the in-chain gate callback — that
	 * bypass is exactly why the helper exists — but it must not get past the
	 * helper's hard AND.
	 */
	public function test_is_ai_enabled_master_gate_is_final() {
		update_option( Jetpack_AI_Settings::MASTER_OPTION, 0 );
		add_filter( 'jetpack_ai_enabled', '__return_true', PHP_INT_MAX );

		$this->assertTrue( apply_filters( 'jetpack_ai_enabled', true ), 'Precondition: a late callback overrides the in-chain gate.' );
		$this->assertFalse( Jetpack_AI_Settings::is_ai_enabled(), 'The helper must keep AI off while the master option is off.' );
	}

	/**
	 * The host gate is final in is_ai_enabled() too.
	 */
	public function test_is_ai_enabled_host_gate_is_final() {
		if ( ! function_exists( 'wp_supports_ai' ) ) {
			$this->markTestSkipped( 'wp_supports_ai() is not available in this WordPress version.' );
		}

		add_filter( 'wp_supports_ai', '__return_false' );
		add_filter( 'jetpack_ai_enabled', '__return_true', PHP_INT_MAX );

		$this->assertFalse( Jetpack_AI_Settings::is_ai_enabled(), 'The helper must keep AI off while the host disallows it.' );
	}

	/**
	 * The helper forwards the call-site default into the filter, keeping
	 * the restrictive-only contract: a self-hosted default of false must never
	 * come back true just because every gate happens to be open.
	 */
	public function test_is_ai_enabled_respects_call_site_default() {
		// Off-Simple the master is the module, so open that gate to isolate the default.
		$this->force_ai_module_active();

		$this->assertFalse( Jetpack_AI_Settings::is_ai_enabled( false ), 'A call-site false must survive open gates.' );
		$this->assertTrue( Jetpack_AI_Settings::is_ai_enabled( true ) );
		$this->assertTrue( Jetpack_AI_Settings::is_ai_enabled(), 'The default parameter is true.' );
	}

	/**
	 * The filter chain still runs inside is_ai_enabled(): a callback may enable AI
	 * from a false default — the gates only ever subtract.
	 */
	public function test_is_ai_enabled_filter_can_enable_when_gates_open() {
		// Gates open means the master (the module off-Simple) is on too.
		$this->force_ai_module_active();
		add_filter( 'jetpack_ai_enabled', '__return_true', 11 );

		$this->assertTrue( Jetpack_AI_Settings::is_ai_enabled( false ) );
	}

	/**
	 * Off-Simple, the master reflects the `ai` module's active state, NOT the
	 * `jetpack_ai_enabled` option. Modules are the master switch there.
	 */
	public function test_is_master_enabled_reflects_module_not_option_off_simple() {
		Constants::set_constant( 'IS_WPCOM', false );

		// Option on, module inactive: the module wins.
		update_option( Jetpack_AI_Settings::MASTER_OPTION, 1 );
		$this->assertFalse( Jetpack_AI_Settings::is_master_enabled(), 'An inactive module means master off even with the option on.' );

		// Option off, module active: the module still wins.
		update_option( Jetpack_AI_Settings::MASTER_OPTION, 0 );
		$this->force_ai_module_active();
		$this->assertTrue( Jetpack_AI_Settings::is_master_enabled(), 'An active module means master on even with the option off.' );
	}

	/**
	 * On WordPress.com Simple, no Jetpack modules run, so the master reflects the
	 * `jetpack_ai_enabled` option, NOT the module.
	 */
	public function test_is_master_enabled_reflects_option_on_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		update_option( Jetpack_AI_Settings::MASTER_OPTION, 0 );
		$this->assertFalse( Jetpack_AI_Settings::is_master_enabled(), 'On Simple the option is the master.' );

		update_option( Jetpack_AI_Settings::MASTER_OPTION, 1 );
		$this->assertTrue( Jetpack_AI_Settings::is_master_enabled() );
	}

	/**
	 * On Simple, the setter writes the option.
	 */
	public function test_set_master_enabled_writes_option_on_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		Jetpack_AI_Settings::set_master_enabled( false );
		$this->assertFalse( (bool) get_option( Jetpack_AI_Settings::MASTER_OPTION ) );

		Jetpack_AI_Settings::set_master_enabled( true );
		$this->assertTrue( (bool) get_option( Jetpack_AI_Settings::MASTER_OPTION ) );
	}

	/**
	 * Off-Simple, the setter deactivates the `ai` module.
	 */
	public function test_set_master_enabled_false_deactivates_module_off_simple() {
		Constants::set_constant( 'IS_WPCOM', false );
		\Jetpack_Options::update_option( 'active_modules', array( 'ai' ) );

		Jetpack_AI_Settings::set_master_enabled( false );

		$this->assertFalse( ( new Modules() )->is_active( 'ai' ) );
	}

	/**
	 * Off-Simple, the setter drives the `ai` module rather than the
	 * jetpack_ai_enabled option: it must call through to Modules::activate( 'ai' ).
	 *
	 * We assert the routing (the setter invokes module activation) rather than the
	 * resulting active state, because activation's own plan and connection gates
	 * belong to Modules::activate() and are environment-specific — under wpcomsh the
	 * plan feature check (wpcom_site_has_feature) refuses an unentitled test site,
	 * which is Modules' concern, not set_master_enabled()'s platform routing.
	 */
	public function test_set_master_enabled_true_activates_module_off_simple() {
		Constants::set_constant( 'IS_WPCOM', false );
		\Jetpack_Options::update_option( 'active_modules', array() );

		// Modules::activate() fires this action before any plan/connection gate, so
		// it deterministically records the activation attempt in every environment.
		$activated = array();
		$spy       = static function ( $module ) use ( &$activated ) {
			$activated[] = $module;
		};
		add_action( 'jetpack_pre_activate_module', $spy );

		Jetpack_AI_Settings::set_master_enabled( true );

		remove_action( 'jetpack_pre_activate_module', $spy );

		// A no-op setter, or one that wrote the option (the on-Simple path), would
		// never fire this action — so it proves the module-activation branch was taken.
		$this->assertContains( 'ai', $activated, 'Off-Simple the setter must activate the ai module.' );
	}

	/**
	 * Off-Simple the module alone is the master: the setter must never write the
	 * `jetpack_ai_enabled` option. WordPress.com reads the master state from the
	 * synced active_modules list, and the option's only remaining off-Simple role
	 * is the legacy pre-module opt-out that Jetpack::reconcile_ai_master_optout()
	 * reads once — a write here would clobber that signal and re-create a second,
	 * driftable source of truth.
	 */
	public function test_set_master_enabled_leaves_option_untouched_off_simple() {
		Constants::set_constant( 'IS_WPCOM', false );
		\Jetpack_Options::update_option( 'active_modules', array( 'ai' ) );

		// Seed the stored legacy opt-out. (Asserting on the stored representation
		// is unreliable — the registered sanitizer casts to boolean and false
		// round-trips as '' or a cached false — so the spies below carry the test.)
		update_option( Jetpack_AI_Settings::MASTER_OPTION, 0 );

		// Trip on any write or delete of the option, whatever the value.
		$touches = 0;
		$spy     = static function ( $value = null ) use ( &$touches ) {
			++$touches;
			return $value;
		};
		add_filter( 'pre_update_option_' . Jetpack_AI_Settings::MASTER_OPTION, $spy );
		add_action( 'delete_option_' . Jetpack_AI_Settings::MASTER_OPTION, $spy );

		Jetpack_AI_Settings::set_master_enabled( false );
		$module_active_after_disable = ( new Modules() )->is_active( 'ai' );

		Jetpack_AI_Settings::set_master_enabled( true );

		remove_filter( 'pre_update_option_' . Jetpack_AI_Settings::MASTER_OPTION, $spy );
		remove_action( 'delete_option_' . Jetpack_AI_Settings::MASTER_OPTION, $spy );

		$this->assertFalse( $module_active_after_disable, 'The module (authoritative master) is off after disabling.' );
		$this->assertSame( 0, $touches, 'The off-Simple setter must never write or delete the jetpack_ai_enabled option.' );

		$stored = get_option( Jetpack_AI_Settings::MASTER_OPTION, 'ABSENT' );
		$this->assertNotSame( 'ABSENT', $stored, 'The stored legacy opt-out is still present after master toggles.' );
		$this->assertEmpty( $stored, 'The stored legacy opt-out still reads falsey after master toggles.' );
	}

	/**
	 * Host gate via core's wp_supports_ai(), when this WordPress version has it.
	 */
	public function test_host_gate_via_wp_supports_ai() {
		if ( ! function_exists( 'wp_supports_ai' ) ) {
			$this->markTestSkipped( 'wp_supports_ai() is not available in this WordPress version.' );
		}

		add_filter( 'wp_supports_ai', '__return_false' );

		$this->assertFalse( Jetpack_AI_Settings::host_allows_ai() );
		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', true ) );
	}

	/**
	 * Host gate via the WP_AI_SUPPORT constant, for WordPress versions that
	 * predate wp_supports_ai(). Separate process so the constant does not leak.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_host_gate_via_constant() {
		if ( function_exists( 'wp_supports_ai' ) ) {
			$this->markTestSkipped( 'wp_supports_ai() exists here; the constant fallback path is not reachable.' );
		}

		define( 'WP_AI_SUPPORT', false );

		$this->assertFalse( Jetpack_AI_Settings::host_allows_ai() );
		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', true ) );
	}

	/**
	 * Per-feature defaults: the new toggles default on; the reused Search option
	 * keeps its established opt-in (off) default; unknown keys are off.
	 */
	public function test_feature_defaults() {
		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'writing_assistant' ) );
		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'image_editor' ) );
		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'ai_seo' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'ai_search' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'seo_enhancer' ), 'The automatic-generation option is not a key here.' );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'no_such_feature' ) );
	}

	/**
	 * The WordPress Agent switches take effect for everyone: a stored-off toggle
	 * turns its feature off with no proxy and no internal testing hostname.
	 */
	public function test_owned_toggles_apply_for_an_ordinary_visitor() {
		$this->assertFalse( jetpack_is_internal_testing_environment(), 'Precondition: an ordinary environment.' );

		update_option( 'jetpack_ai_writing_assistant_enabled', 0 );
		update_option( 'jetpack_ai_image_editor_enabled', 0 );
		update_option( 'jetpack_ai_feature_clip_enabled', 0 );
		update_option( 'jetpack_ai_seo_enabled', 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'writing_assistant' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'image_editor' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'feature_clip' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'ai_seo' ) );
	}

	/**
	 * The reused Search option is not one of the controls this class owns: it
	 * ships with its own settings surface, so it applies everywhere.
	 */
	public function test_reused_toggles_apply_everywhere() {
		update_option( 'jetpack_search_ai_answers_enabled', 1 );

		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'ai_search' ) );

		update_option( 'jetpack_search_ai_answers_enabled', 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'ai_search' ) );
	}

	/**
	 * The SEO feature (AI SEO metadata generation, manual and automatic) is a
	 * listed control: its own option switches it off while every outer gate is
	 * open. Internal testing environment, where the owned toggles apply.
	 */
	public function test_seo_feature_follows_its_option() {
		$this->force_ai_module_active();

		$this->assertTrue( Jetpack_AI_Settings::is_ai_seo_enabled(), 'Defaults on with every gate open.' );

		update_option( 'jetpack_ai_seo_enabled', 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_ai_seo_enabled() );
	}

	/**
	 * The master gate rides the SEO feature filter: master off means the
	 * feature is effectively off while the saved option value is preserved,
	 * so the choice returns when the master does.
	 */
	public function test_seo_feature_master_off_preserves_saved_value() {

		// Seed off first so the row exists: a write equal to the registered
		// default is short-circuited by update_option and stores nothing.
		update_option( 'jetpack_ai_seo_enabled', 0 );
		update_option( 'jetpack_ai_seo_enabled', 1 );

		// Off-Simple the `ai` module is the master and is inactive by default here.
		$this->assertFalse( Jetpack_AI_Settings::is_master_enabled() );
		$this->assertFalse( Jetpack_AI_Settings::is_ai_seo_enabled(), 'Master off must turn the SEO feature off.' );
		$this->assertTrue( (bool) get_option( 'jetpack_ai_seo_enabled', false ), 'The saved value must survive the master.' );

		// The saved choice returns when the master does.
		$this->force_ai_module_active();
		$this->assertTrue( Jetpack_AI_Settings::is_ai_seo_enabled() );
	}

	/**
	 * The gates are final in is_ai_seo_enabled() too: a late-priority filter can
	 * override the in-chain gate callback, but not the helper's hard AND.
	 */
	public function test_seo_feature_late_filter_cannot_beat_master() {
		add_filter( 'jetpack_ai_seo_enabled', '__return_true', 999 );

		// Off-Simple the `ai` module is the master and is inactive by default here.
		$this->assertFalse( Jetpack_AI_Settings::is_master_enabled() );
		$late_filter_wins = Jetpack_AI_Settings::is_ai_seo_enabled();

		remove_filter( 'jetpack_ai_seo_enabled', '__return_true', 999 );

		$this->assertFalse( $late_filter_wins, 'A late filter must not resurrect the SEO feature past the master.' );
	}

	/**
	 * On WordPress.com Simple the owned features have no per-feature toggles,
	 * so a stored off value cannot switch the SEO feature off there.
	 */
	public function test_seo_feature_forced_on_for_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		update_option( Jetpack_AI_Settings::MASTER_OPTION, 1 );
		update_option( 'jetpack_ai_seo_enabled', 0 );

		$this->assertTrue( Jetpack_AI_Settings::is_ai_seo_enabled() );
	}

	/**
	 * A feature's option turns it off where the owned toggles apply.
	 */
	public function test_feature_option_off() {

		update_option( 'jetpack_ai_writing_assistant_enabled', 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'writing_assistant' ) );
	}

	/**
	 * WordPress.com Simple has no per-feature toggles: the options Jetpack owns
	 * are ignored there, so a stored `off` cannot switch a feature off. Simple
	 * keeps the existing wp.com settings contract instead.
	 */
	public function test_owned_features_ignore_their_option_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		foreach ( Jetpack_AI_Settings::OWNED_FEATURES as $feature ) {
			update_option( Jetpack_AI_Settings::FEATURE_OPTIONS[ $feature ], 0 );

			$this->assertTrue(
				Jetpack_AI_Settings::is_feature_enabled( $feature ),
				"$feature should stay on for WordPress.com Simple"
			);
		}
	}

	/**
	 * The Simple carve-out is scoped to the features Jetpack owns. SEO and
	 * Search reuse pre-existing options that keep their own controls on Simple,
	 * so their values must still be honored there.
	 */
	public function test_reused_features_still_read_their_option_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		// Off must stay off: a carve-out that returned true for every feature
		// would switch these on for Simple.
		update_option( 'ai_seo_enhancer_enabled', 0 );
		update_option( 'jetpack_search_ai_answers_enabled', 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'ai_search' ) );

		// ...and on must stay on, so the value is genuinely read rather than
		// hardcoded in either direction.
		update_option( 'jetpack_search_ai_answers_enabled', 1 );

		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'ai_search' ) );
	}

	/**
	 * Off Simple the same option still switches the feature off, where the
	 * owned toggles apply.
	 */
	public function test_owned_features_honor_their_option_off_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', false );

		update_option( 'jetpack_ai_image_editor_enabled', 0 );

		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'image_editor' ) );
	}

	/**
	 * The owned per-feature options sync to WordPress.com. The master option
	 * deliberately does not: off-Simple the `ai` module is the master and its
	 * state reaches WordPress.com via the synced active_modules callable.
	 */
	public function test_sync_options_whitelist() {
		$whitelist = apply_filters( 'jetpack_sync_options_whitelist', array() );

		$this->assertNotContains( 'jetpack_ai_enabled', $whitelist );
		$this->assertContains( 'jetpack_ai_writing_assistant_enabled', $whitelist );
		$this->assertContains( 'jetpack_ai_image_editor_enabled', $whitelist );
		$this->assertContains( 'jetpack_ai_seo_enabled', $whitelist );
		$this->assertNotContains( 'jetpack_ai_image_label_enabled', $whitelist );
	}

	/**
	 * The owned options are registered (register_setting on init) in their own
	 * group so saving Settings > General cannot clear fields that form does not
	 * contain. The master option must stay OUT of core settings REST: off-Simple
	 * the module is the master (a core-REST write would only clobber the legacy
	 * opt-out value), and the dedicated feature-settings endpoint is the real
	 * writable surface.
	 */
	public function test_options_are_registered() {
		global $new_allowed_options;

		Jetpack_AI_Settings::register_settings();

		$registered = get_registered_settings();
		$options    = array( Jetpack_AI_Settings::MASTER_OPTION );
		foreach ( Jetpack_AI_Settings::OWNED_FEATURES as $feature ) {
			$options[] = Jetpack_AI_Settings::FEATURE_OPTIONS[ $feature ];
		}

		foreach ( $options as $option ) {
			$this->assertArrayHasKey( $option, $registered );
			$this->assertSame( 'jetpack_ai', $registered[ $option ]['group'] );
			$this->assertContains( $option, $new_allowed_options['jetpack_ai'] ?? array() );
		}
		$this->assertEmpty(
			array_intersect( $options, $new_allowed_options['general'] ?? array() ),
			'Jetpack AI settings must not be submitted with the General Settings form.'
		);
		$this->assertArrayNotHasKey( 'jetpack_ai_image_label_enabled', $registered );

		$this->assertFalse( $registered['jetpack_ai_enabled']['show_in_rest'], 'The master option is never exposed over core settings REST.' );
		$this->assertTrue( (bool) $registered['jetpack_ai_writing_assistant_enabled']['show_in_rest'], 'Feature options stay REST-exposed off-Simple.' );
	}
}
