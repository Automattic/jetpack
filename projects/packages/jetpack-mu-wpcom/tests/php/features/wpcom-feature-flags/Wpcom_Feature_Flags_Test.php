<?php
/**
 * Tests for the Automattician-only feature flag control panel.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-feature-flags/class-wpcom-feature-flags.php';

// The real support session detector, so the Atomic branch of the gate is tested
// against wpcomsh's own logic rather than a stand-in.
require_once Jetpack_Mu_Wpcom::PKG_DIR . '../../plugins/wpcomsh/support-session.php';

/**
 * Tests the Automattician gate, the site-wide override store, and the way
 * overrides answer the feature flag package's resolution filter.
 */
class Wpcom_Feature_Flags_Test extends \WorDBless\BaseTestCase {

	/**
	 * What the package bootstrap wired, captured before any test runs.
	 *
	 * The suite's bootstrap calls Jetpack_Mu_Wpcom::init(), which is what makes
	 * this feature exist on real sites. Recorded here because tear_down() strips
	 * the same hooks between tests.
	 *
	 * @var array<string, mixed>
	 */
	private static $bootstrap_wiring = array();

	/**
	 * Record the bootstrap's hook registrations before any test disturbs them.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$bootstrap_wiring = array(
			'filter' => has_filter( 'jetpack_feature_flag_enabled', array( Wpcom_Feature_Flags::class, 'filter_enabled' ) ),
			'action' => has_action( 'admin_menu', array( Wpcom_Feature_Flags::class, 'register_admin_page' ) ),
		);
	}

	/**
	 * Reset every piece of global state these tests touch.
	 */
	public function tear_down() {
		unset( $_SERVER['REQUEST_METHOD'] );
		$_POST = array();
		$_GET  = array();
		Constants::clear_constants();
		unset( $_COOKIE[ \WPCOMSH_Support_Session_Detect::COOKIE_NAME ] );
		delete_option( Wpcom_Feature_Flags::OVERRIDES_OPTION );
		remove_all_filters( 'jetpack_feature_flag_enabled' );
		remove_all_filters( 'jetpack_feature_flag_enabled_my-feature' );
		remove_all_filters( 'wp_die_handler' );
		Feature_Flags::reset();
		wp_set_current_user( 0 );
		$GLOBALS['submenu']           = array();
		$GLOBALS['_registered_pages'] = array();

		parent::tear_down();
	}

	/**
	 * Make the request look like a proxied Automattician request on Atomic.
	 */
	private function simulate_proxied_atomic_request() {
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );
	}

	/**
	 * Create an administrator and make them the current user.
	 *
	 * @return int The new user's ID.
	 */
	private function login_as_admin() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'flags-admin',
				'user_pass'  => 'password',
				'user_email' => 'flags-admin@example.com',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $user_id );

		return (int) $user_id;
	}

	/**
	 * The package bootstrap has to actually wire this feature up.
	 *
	 * Everything else here calls Wpcom_Feature_Flags::init() by hand, so without
	 * this the whole suite stays green while the two lines in
	 * Jetpack_Mu_Wpcom::init() that make the feature exist on Simple and Atomic
	 * are deleted — the screen and every override silently stop working.
	 */
	public function test_package_bootstrap_wires_the_feature() {
		$this->assertNotFalse(
			self::$bootstrap_wiring['filter'],
			'Jetpack_Mu_Wpcom::init() must call Wpcom_Feature_Flags::init() so overrides answer the resolution filter.'
		);
		$this->assertNotFalse(
			self::$bootstrap_wiring['action'],
			'Jetpack_Mu_Wpcom::init() must call Wpcom_Feature_Flags::init() so the admin screen is registered.'
		);
	}

	/**
	 * Off Simple and unproxied, nothing identifies the visitor as an
	 * Automattician, so the gate must fail closed.
	 */
	public function test_gate_fails_closed_by_default() {
		$this->assertFalse( Wpcom_Feature_Flags::is_a11n() );
	}

	/**
	 * On Atomic the a8c proxy is what identifies an Automattician.
	 */
	public function test_gate_passes_for_proxied_atomic_request() {
		$this->simulate_proxied_atomic_request();

		$this->assertTrue( Wpcom_Feature_Flags::is_a11n() );
	}

	/**
	 * A support session also arrives through the proxy, but it is driven by a
	 * Happiness Engineer acting for the site owner rather than by an
	 * Automattician testing unreleased work. It must not open the panel.
	 */
	public function test_gate_rejects_atomic_support_session() {
		$this->simulate_proxied_atomic_request();
		$_COOKIE[ \WPCOMSH_Support_Session_Detect::COOKIE_NAME ] = 'true';

		$this->assertFalse( Wpcom_Feature_Flags::is_a11n() );
	}

	/**
	 * On Simple the platform's own is_automattician() is authoritative. It does
	 * not exist in this environment, so the gate has to fail closed rather than
	 * fall back to the proxy constant.
	 */
	public function test_gate_on_simple_requires_platform_automattician_check() {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->simulate_proxied_atomic_request();

		$this->assertFalse( Wpcom_Feature_Flags::is_a11n() );
	}

	/**
	 * A site with no overrides stored must report an empty map, not a false or
	 * a scalar left over from the option default.
	 */
	public function test_get_overrides_defaults_to_empty_array() {
		$this->assertSame( array(), Wpcom_Feature_Flags::get_overrides() );
	}

	/**
	 * Overrides survive a round trip through the option, as booleans.
	 */
	public function test_save_overrides_persists_booleans() {
		Wpcom_Feature_Flags::save_overrides(
			array(
				'my-feature'    => true,
				'other-feature' => false,
			)
		);

		$this->assertSame(
			array(
				'my-feature'    => true,
				'other-feature' => false,
			),
			Wpcom_Feature_Flags::get_overrides()
		);
	}

	/**
	 * Flag names arrive as submitted form keys and registration never validates
	 * them at runtime, so anything that could not be a real flag name has to be
	 * discarded before it reaches the option.
	 */
	public function test_save_overrides_drops_invalid_flag_names() {
		Wpcom_Feature_Flags::save_overrides(
			array(
				'Valid-Caps'    => true,
				'-leading-dash' => true,
				'has spaces'    => true,
				'valid-flag'    => true,
			)
		);

		$this->assertSame( array( 'valid-flag' => true ), Wpcom_Feature_Flags::get_overrides() );
	}

	/**
	 * Saving an empty map removes the option entirely rather than storing an
	 * empty array, so a site that never used the panel carries no row.
	 */
	public function test_save_overrides_with_empty_map_deletes_the_option() {
		Wpcom_Feature_Flags::save_overrides( array( 'my-feature' => true ) );

		Wpcom_Feature_Flags::save_overrides( array() );

		$this->assertFalse( get_option( Wpcom_Feature_Flags::OVERRIDES_OPTION ) );
		$this->assertSame( array(), Wpcom_Feature_Flags::get_overrides() );
	}

	/**
	 * A corrupted option must not leak non-boolean values into flag resolution.
	 */
	public function test_get_overrides_ignores_a_malformed_option() {
		update_option( Wpcom_Feature_Flags::OVERRIDES_OPTION, 'not-an-array' );

		$this->assertSame( array(), Wpcom_Feature_Flags::get_overrides() );
	}

	/**
	 * The three-state form control maps onto "force on", "force off", and "no
	 * override at all".
	 */
	public function test_states_map_on_and_off_to_overrides() {
		$overrides = Wpcom_Feature_Flags::overrides_from_states(
			array(
				'forced-on'  => 'on',
				'forced-off' => 'off',
			)
		);

		$this->assertSame(
			array(
				'forced-on'  => true,
				'forced-off' => false,
			),
			$overrides
		);
	}

	/**
	 * "default" is the absence of an override, not an override to the
	 * registered default: a flag left alone must keep following whatever the
	 * code that registered it decides later.
	 */
	public function test_states_map_default_to_no_override() {
		$overrides = Wpcom_Feature_Flags::overrides_from_states(
			array(
				'left-alone' => 'default',
				'forced-on'  => 'on',
			)
		);

		$this->assertSame( array( 'forced-on' => true ), $overrides );
	}

	/**
	 * An unrecognized state is not a silent "on".
	 */
	public function test_states_map_ignores_unknown_states() {
		$this->assertSame( array(), Wpcom_Feature_Flags::overrides_from_states( array( 'my-feature' => 'maybe' ) ) );
	}

	/**
	 * Forcing a flag on overrules the default it was registered with.
	 */
	public function test_override_forces_registered_flag_on() {
		Feature_Flags::register( 'my-feature', array( 'default' => false ) );
		Wpcom_Feature_Flags::save_overrides( array( 'my-feature' => true ) );
		Wpcom_Feature_Flags::init();

		$this->assertTrue( Feature_Flags::is_enabled( 'my-feature' ) );
	}

	/**
	 * Forcing a flag off works too — the panel is a kill switch as much as it
	 * is an early-access switch.
	 */
	public function test_override_forces_registered_flag_off() {
		Feature_Flags::register( 'my-feature', array( 'default' => true ) );
		Wpcom_Feature_Flags::save_overrides( array( 'my-feature' => false ) );
		Wpcom_Feature_Flags::init();

		$this->assertFalse( Feature_Flags::is_enabled( 'my-feature' ) );
	}

	/**
	 * Flags nobody overrode keep resolving to their registered default.
	 */
	public function test_flag_without_override_keeps_registered_default() {
		Feature_Flags::register( 'untouched-feature', array( 'default' => true ) );
		Wpcom_Feature_Flags::save_overrides( array( 'my-feature' => false ) );
		Wpcom_Feature_Flags::init();

		$this->assertTrue( Feature_Flags::is_enabled( 'untouched-feature' ) );
	}

	/**
	 * Unknown flags still pass through the package's resolution filter, and a
	 * flag is often checked in one codebase before it is registered in another,
	 * so an override has to keep resolving for a name the local registry does
	 * not know.
	 */
	public function test_override_applies_to_unregistered_flag() {
		Wpcom_Feature_Flags::save_overrides( array( 'not-registered-anywhere' => true ) );
		Wpcom_Feature_Flags::init();

		$this->assertTrue( Feature_Flags::is_enabled( 'not-registered-anywhere' ) );
	}

	/**
	 * Overrides are stored site-wide on purpose: an Automattician flips a flag
	 * to see how the site behaves, including for logged-out visitors. So
	 * resolution must not re-check the Automattician gate — only the panel
	 * itself is gated.
	 */
	public function test_override_applies_regardless_of_current_user() {
		Feature_Flags::register( 'my-feature', array( 'default' => false ) );
		Wpcom_Feature_Flags::save_overrides( array( 'my-feature' => true ) );
		Wpcom_Feature_Flags::init();

		$this->assertFalse( Wpcom_Feature_Flags::is_a11n(), 'Guard: this test is meaningless if the gate passes.' );
		$this->assertTrue( Feature_Flags::is_enabled( 'my-feature' ) );
	}

	/**
	 * The Tools submenu exists for a proxied Automattician who can manage the
	 * site.
	 */
	public function test_admin_page_registered_for_proxied_automattician() {
		$this->login_as_admin();
		$this->simulate_proxied_atomic_request();

		$this->assertNotFalse( Wpcom_Feature_Flags::register_admin_page() );
	}

	/**
	 * The Tools menu is a shared surface a site owner also looks at, so the
	 * entry has to read as internal Automattic tooling at a glance rather than
	 * as one more site feature.
	 */
	public function test_menu_entry_is_labelled_as_internal() {
		$this->become_automattician_admin();

		Wpcom_Feature_Flags::register_admin_page();

		$titles = wp_list_pluck( $GLOBALS['submenu']['tools.php'], 0 );
		$this->assertNotEmpty(
			array_filter(
				$titles,
				static function ( $title ) {
					return is_string( $title ) && str_contains( $title, 'a8c' );
				}
			),
			'Expected the Tools submenu entry to be marked a8c.'
		);
	}

	/**
	 * The screen says what it is, so an Automattician who lands on it — or a
	 * site owner watching a screen share — is not left guessing whether this is
	 * a supported feature.
	 */
	public function test_admin_page_states_it_is_automatticians_only() {
		$this->become_automattician_admin();

		$output = $this->render_admin_page();

		$this->assertStringContainsString( 'Automatticians only', $output );
	}

	/**
	 * The refusal explains why rather than reading as a generic capability
	 * failure a site owner might file a support ticket about.
	 */
	public function test_refusal_explains_the_screen_is_automatticians_only() {
		$this->login_as_admin();
		add_filter( 'wp_die_handler', array( $this, 'throwing_wp_die_handler' ) );

		$this->expectExceptionMessageMatches( '/Automatticians only/' );

		Wpcom_Feature_Flags::render_admin_page();
	}

	/**
	 * An administrator who is not an Automattician never sees the panel, even
	 * though they hold every capability on the site.
	 */
	public function test_admin_page_not_registered_without_the_a11n_gate() {
		$this->login_as_admin();

		$this->assertFalse( Wpcom_Feature_Flags::register_admin_page() );
	}

	/**
	 * The write path is gated independently of the menu: a valid nonce from a
	 * full administrator is not enough without the Automattician gate.
	 */
	public function test_save_handler_rejects_a_non_automattician() {
		$this->login_as_admin();

		$saved = Wpcom_Feature_Flags::handle_save(
			array(
				'_wpnonce'   => wp_create_nonce( Wpcom_Feature_Flags::NONCE_ACTION ),
				'flag_state' => array( 'my-feature' => 'on' ),
			)
		);

		$this->assertFalse( $saved );
		$this->assertSame( array(), Wpcom_Feature_Flags::get_overrides() );
	}

	/**
	 * A valid nonce plus the Automattician gate plus the capability persists
	 * the submitted states.
	 */
	public function test_save_handler_persists_states_for_an_automattician() {
		$this->login_as_admin();
		$this->simulate_proxied_atomic_request();

		$saved = Wpcom_Feature_Flags::handle_save(
			array(
				'_wpnonce'   => wp_create_nonce( Wpcom_Feature_Flags::NONCE_ACTION ),
				'flag_state' => array(
					'my-feature'    => 'on',
					'other-feature' => 'off',
					'left-alone'    => 'default',
				),
			)
		);

		$this->assertTrue( $saved );
		$this->assertSame(
			array(
				'my-feature'    => true,
				'other-feature' => false,
			),
			Wpcom_Feature_Flags::get_overrides()
		);
	}

	/**
	 * A missing or stale nonce is rejected even for an Automattician.
	 */
	public function test_save_handler_rejects_a_bad_nonce() {
		$this->login_as_admin();
		$this->simulate_proxied_atomic_request();

		$saved = Wpcom_Feature_Flags::handle_save(
			array(
				'_wpnonce'   => 'not-a-nonce',
				'flag_state' => array( 'my-feature' => 'on' ),
			)
		);

		$this->assertFalse( $saved );
		$this->assertSame( array(), Wpcom_Feature_Flags::get_overrides() );
	}

	/**
	 * Saving with every control back on "default" clears the site's overrides.
	 */
	public function test_save_handler_clears_overrides() {
		$this->login_as_admin();
		$this->simulate_proxied_atomic_request();
		Wpcom_Feature_Flags::save_overrides( array( 'my-feature' => true ) );

		Wpcom_Feature_Flags::handle_save(
			array(
				'_wpnonce'   => wp_create_nonce( Wpcom_Feature_Flags::NONCE_ACTION ),
				'flag_state' => array( 'my-feature' => 'default' ),
			)
		);

		$this->assertSame( array(), Wpcom_Feature_Flags::get_overrides() );
	}

	/**
	 * A registered flag is listed with the metadata it was registered with, and
	 * with its control sitting on "default" while nothing overrides it.
	 */
	public function test_admin_page_lists_a_registered_flag() {
		$this->become_automattician_admin();
		Feature_Flags::register(
			'my-feature',
			array(
				'default'     => true,
				'description' => 'Gates the new flow.',
				'owner'       => 'my-product',
			)
		);

		$output = $this->render_admin_page();

		$this->assertStringContainsString( 'my-feature', $output );
		$this->assertStringContainsString( 'Gates the new flow.', $output );
		$this->assertStringContainsString( 'my-product', $output );
		$this->assertStringContainsString( 'name="flag_state[my-feature]"', $output );
		$this->assertMatchesRegularExpression(
			'/name="flag_state\[my-feature\]"\s+value="default"\s+checked/',
			$output
		);
	}

	/**
	 * The control reflects the override already in force, so the screen can be
	 * read as the site's current state rather than just a set of buttons.
	 */
	public function test_admin_page_marks_the_flag_state_currently_forced() {
		$this->become_automattician_admin();
		Feature_Flags::register( 'my-feature', array( 'default' => false ) );
		Wpcom_Feature_Flags::save_overrides( array( 'my-feature' => true ) );

		$output = $this->render_admin_page();

		$this->assertMatchesRegularExpression(
			'/name="flag_state\[my-feature\]"\s+value="on"\s+checked/',
			$output
		);
	}

	/**
	 * Flags get retired, and an override can outlive the register() call it was
	 * set against. It has to stay visible on the screen that set it — otherwise
	 * it becomes a stuck value with no way to find it again and clear it.
	 */
	public function test_admin_page_lists_an_overridden_flag_that_is_not_registered() {
		$this->become_automattician_admin();
		Wpcom_Feature_Flags::save_overrides( array( 'retired-flag' => false ) );

		$output = $this->render_admin_page();

		$this->assertStringContainsString( 'retired-flag', $output );
		$this->assertStringContainsString( 'Not registered on this site.', $output );
		$this->assertMatchesRegularExpression(
			'/name="flag_state\[retired-flag]"\s+value="off"\s+checked/',
			$output
		);
	}

	/**
	 * Nothing registers flags on Simple yet, so the empty screen has to explain
	 * itself instead of looking broken.
	 */
	public function test_admin_page_explains_itself_when_no_flags_exist() {
		$this->become_automattician_admin();

		$output = $this->render_admin_page();

		$this->assertStringContainsString( 'No feature flags are registered on this site', $output );
	}

	/**
	 * An accepted submission saves and redirects, so a reload cannot re-post it.
	 */
	public function test_submission_saves_and_redirects() {
		$this->become_automattician_admin();
		$this->simulate_post(
			array(
				'_wpnonce'   => wp_create_nonce( Wpcom_Feature_Flags::NONCE_ACTION ),
				'flag_state' => array( 'my-feature' => 'on' ),
			)
		);

		$redirect = Wpcom_Feature_Flags::maybe_handle_submission();

		$this->assertIsString( $redirect );
		$this->assertStringContainsString( 'flags-notice=saved', $redirect );
		$this->assertSame( array( 'my-feature' => true ), Wpcom_Feature_Flags::get_overrides() );
	}

	/**
	 * A rejected submission has to be reported, not swallowed.
	 *
	 * A nonce goes stale on a tab left open, and this is a screen you leave open.
	 * Redirecting back with no notice is indistinguishable from a successful save
	 * of the values already stored, so the flag silently keeps its old value.
	 */
	public function test_rejected_submission_redirects_with_a_rejection() {
		$this->become_automattician_admin();
		$this->simulate_post(
			array(
				'_wpnonce'   => 'stale-nonce',
				'flag_state' => array( 'my-feature' => 'on' ),
			)
		);

		$redirect = Wpcom_Feature_Flags::maybe_handle_submission();

		$this->assertIsString( $redirect );
		$this->assertStringContainsString( 'flags-notice=rejected', $redirect );
		$this->assertSame( array(), Wpcom_Feature_Flags::get_overrides() );
	}

	/**
	 * Loading the screen is not a submission.
	 */
	public function test_a_plain_page_load_is_not_a_submission() {
		$this->become_automattician_admin();

		$this->assertNull( Wpcom_Feature_Flags::maybe_handle_submission() );
	}

	/**
	 * The redirect's outcome is what the screen reports.
	 */
	public function test_admin_page_confirms_a_save() {
		$this->become_automattician_admin();
		$_GET['flags-notice'] = 'saved';

		$output = $this->render_admin_page();

		$this->assertStringContainsString( 'Overrides saved.', $output );
	}

	/**
	 * A rejection is surfaced as an error, not silence.
	 */
	public function test_admin_page_reports_a_rejection() {
		$this->become_automattician_admin();
		$_GET['flags-notice'] = 'rejected';

		$output = $this->render_admin_page();

		$this->assertStringContainsString( 'not saved', $output );
		$this->assertStringNotContainsString( 'Overrides saved.', $output );
	}

	/**
	 * A plain load reports neither outcome.
	 */
	public function test_admin_page_reports_nothing_when_not_submitting() {
		$this->become_automattician_admin();

		$output = $this->render_admin_page();

		$this->assertStringNotContainsString( 'not saved', $output );
		$this->assertStringNotContainsString( 'Overrides saved.', $output );
	}

	/**
	 * The Effective column reports what the flag actually resolves to, so an
	 * override that took hold reads as On even though the flag was registered Off.
	 */
	public function test_admin_page_shows_the_effective_value() {
		$this->become_automattician_admin();
		Feature_Flags::register( 'my-feature', array( 'default' => false ) );
		Wpcom_Feature_Flags::save_overrides( array( 'my-feature' => true ) );
		Wpcom_Feature_Flags::init();

		$output = $this->render_admin_page();

		// Default, then Effective.
		$this->assertStringContainsString( '<td>Off</td><td>On</td>', $this->compact( $output ) );
	}

	/**
	 * The per-flag `jetpack_feature_flag_enabled_{flag}` filter runs after ours
	 * and beats it. Without the Effective column the screen cannot answer the one
	 * question it exists for — "I forced it on, so why is the feature still off?"
	 * — because the control would still read "Force on".
	 */
	public function test_admin_page_effective_value_reflects_a_winning_per_flag_filter() {
		$this->become_automattician_admin();
		Feature_Flags::register( 'my-feature', array( 'default' => false ) );
		Wpcom_Feature_Flags::save_overrides( array( 'my-feature' => true ) );
		Wpcom_Feature_Flags::init();
		add_filter( 'jetpack_feature_flag_enabled_my-feature', '__return_false' );

		$output = $this->render_admin_page();

		$this->assertFalse( Feature_Flags::is_enabled( 'my-feature' ), 'Guard: the per-flag filter must win.' );
		$this->assertMatchesRegularExpression(
			'/name="flag_state\[my-feature\]"\s+value="on"\s+checked/',
			$output,
			'The control still shows the override this screen set.'
		);
		// Default, then Effective — the override says on, the effective value does not.
		$this->assertStringContainsString( '<td>Off</td><td>Off</td>', $this->compact( $output ) );
	}

	/**
	 * A flag whose name fails the package's pattern cannot have an override
	 * stored, because sanitize_overrides() drops it. Offering a control anyway
	 * means clicking Save, seeing "Overrides saved.", and watching the control
	 * snap back with no explanation.
	 */
	public function test_admin_page_refuses_to_offer_a_control_for_an_invalid_flag_name() {
		$this->become_automattician_admin();
		// phpcs:ignore Jetpack.FeatureFlags.FeatureFlagName.Invalid -- Deliberately invalid; the sniff never runs against the wpcom Simple codebase, which is why the screen has to cope with such a name at all.
		Feature_Flags::register( 'Invalid_Name', array( 'default' => false ) );

		$output = $this->render_admin_page();

		$this->assertStringContainsString( 'Invalid_Name', $output );
		$this->assertStringNotContainsString( 'name="flag_state[Invalid_Name]"', $output );
		$this->assertStringContainsString( 'cannot', $output );
	}

	/**
	 * Flag names are the row headers, so a screen reader announces which flag a
	 * cell belongs to.
	 */
	public function test_admin_page_uses_row_headers_for_flag_names() {
		$this->become_automattician_admin();
		Feature_Flags::register( 'my-feature', array( 'default' => false ) );

		$output = $this->render_admin_page();

		$this->assertMatchesRegularExpression( '/<th scope="row">\s*<code>my-feature<\/code>/', $output );
	}

	/**
	 * Each flag's three radios are one group, and the group carries the flag
	 * name. Without it a screen reader reads every row as the same anonymous
	 * "Default / Force on / Force off" with no way to tell which flag is being
	 * changed.
	 */
	public function test_admin_page_names_each_flags_radio_group() {
		$this->become_automattician_admin();
		Feature_Flags::register( 'my-feature', array( 'default' => false ) );

		$output = $this->render_admin_page();

		$this->assertMatchesRegularExpression(
			'/<legend class="screen-reader-text">[^<]*my-feature[^<]*<\/legend>/',
			$output
		);
	}

	/**
	 * Flag metadata comes from whatever code called register(), so it is escaped
	 * on the way out.
	 */
	public function test_admin_page_escapes_flag_metadata() {
		$this->become_automattician_admin();
		Feature_Flags::register(
			'my-feature',
			array( 'description' => '<script>alert(1)</script>' )
		);

		$output = $this->render_admin_page();

		$this->assertStringNotContainsString( '<script>alert(1)</script>', $output );
		$this->assertStringContainsString( '&lt;script&gt;', $output );
	}

	/**
	 * Reaching the screen's URL directly is not a way around the gate.
	 */
	public function test_admin_page_refuses_a_non_automattician() {
		$this->login_as_admin();
		add_filter( 'wp_die_handler', array( $this, 'throwing_wp_die_handler' ) );

		$this->expectException( \RuntimeException::class );

		Wpcom_Feature_Flags::render_admin_page();
	}

	/**
	 * Return a wp_die handler that throws instead of exiting, so wp_die() can be
	 * asserted on.
	 *
	 * @return callable
	 */
	public function throwing_wp_die_handler() {
		/**
		 * Stand in for wp_die()'s exit.
		 *
		 * @param mixed $message The wp_die() message.
		 * @return never
		 * @throws \RuntimeException Always.
		 */
		return function ( $message ) {
			throw new \RuntimeException( is_string( $message ) ? $message : 'wp_die' );
		};
	}

	/**
	 * Become an administrator who also passes the Automattician gate.
	 *
	 * @return void
	 */
	private function become_automattician_admin() {
		$this->login_as_admin();
		$this->simulate_proxied_atomic_request();
	}

	/**
	 * Make the next render look like a form submission.
	 *
	 * @param array $post The submitted fields.
	 * @return void
	 */
	private function simulate_post( array $post ) {
		$_SERVER['REQUEST_METHOD'] = 'POST';
		$_POST                     = $post;
	}

	/**
	 * Strip whitespace so markup can be asserted on without pinning indentation.
	 *
	 * @param string $output Rendered markup.
	 * @return string The markup with all whitespace runs removed.
	 */
	private function compact( $output ) {
		return (string) preg_replace( '/\s+/', '', $output );
	}

	/**
	 * Capture the screen's markup.
	 *
	 * @return string The rendered page.
	 */
	private function render_admin_page() {
		ob_start();
		Wpcom_Feature_Flags::render_admin_page();

		return (string) ob_get_clean();
	}
}
